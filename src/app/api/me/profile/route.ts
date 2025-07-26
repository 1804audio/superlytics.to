import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, badRequest } from '@/lib/response';
import { getUser, updateUser, getUserByUsername } from '@/queries';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const schema = z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const userId = auth.user.id;
  const { username, email } = body;

  // Get current user data
  const currentUser = await getUser(userId);
  if (!currentUser) {
    return badRequest('User not found');
  }

  const updateData: any = {};

  // Check if username is being updated and if it's available
  if (username && username !== currentUser.username) {
    const existingUser = await getUserByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      return badRequest('Username is already taken');
    }
    updateData.username = username;
  }

  // Check if email is being updated and if it's available
  if (email && email !== currentUser.email) {
    const existingUserByEmail = await prisma.client.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail && existingUserByEmail.id !== userId) {
      return badRequest('Email is already taken');
    }
    updateData.email = email;
  }

  // If no changes, return current user
  if (Object.keys(updateData).length === 0) {
    return json(currentUser);
  }

  // Update user
  const updatedUser = await updateUser(userId, updateData);

  return json(updatedUser);
}
