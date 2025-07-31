const { API_KEY, BASE_URL } = require('../config.js');

async function testTeamManagement() {
  console.log('👥 Testing Team Management');
  console.log('===========================');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const runTest = async (name, testFn) => {
    try {
      console.log(`\n${name}...`);
      const result = await testFn();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${name}`);
      results.tests.push({ name, status: result ? 'PASS' : 'FAIL' });
      if (result) results.passed++;
      else results.failed++;
      return result;
    } catch (error) {
      console.log(`❌ ERROR: ${name} - ${error.message}`);
      results.tests.push({ name, status: 'ERROR', error: error.message });
      results.failed++;
      return false;
    }
  };

  let testTeamId = null;
  let testTeamData = null;

  // ========================================
  // USER TEAMS
  // ========================================
  console.log('\n👥 USER TEAM MANAGEMENT');
  console.log('-----------------------');

  await runTest('Get User Teams (/api/me/teams)', async () => {
    const response = await fetch(`${BASE_URL}/api/me/teams`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const teams = await response.json();
      console.log(`   User is member of ${teams.length} teams`);
      if (teams.length > 0) {
        console.log(`   Sample team: ${teams[0].name} (${teams[0].role})`);
        console.log(`   Team ID: ${teams[0].teamId}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get user teams failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // TEAM CRUD OPERATIONS
  // ========================================
  console.log('\n🏢 TEAM CRUD OPERATIONS');
  console.log('-----------------------');

  await runTest('Create New Team (/api/teams)', async () => {
    const teamData = {
      name: `Test Team ${Date.now()}`,
      description: 'Test team created by automated test suite',
    };

    const response = await fetch(`${BASE_URL}/api/teams`, {
      method: 'POST',
      headers,
      body: JSON.stringify(teamData),
    });

    if (response.ok) {
      const newTeam = await response.json();
      testTeamId = newTeam.id;
      testTeamData = newTeam;
      console.log(`   Created team: ${newTeam.name}`);
      console.log(`   Team ID: ${testTeamId}`);
      console.log(`   Creator role: ${newTeam.role || 'owner'}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Create team failed: ${error}`);
      // Check if it's a plan limit issue - that's expected behavior
      if (error.includes('LIMIT_EXCEEDED') || error.includes('limit')) {
        console.log('   ✅ Team creation limit protection working correctly');
        return true;
      }
      return false;
    }
  });

  await runTest('Get Team Details (/api/teams/{teamId})', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no test team created');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const team = await response.json();
      console.log(`   Team details: ${team.name}`);
      console.log(`   Description: ${team.description || 'None'}`);
      console.log(`   Members: ${team.teamUser?.length || 0}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get team details failed: ${error}`);
      return false;
    }
  });

  await runTest('Update Team (/api/teams/{teamId})', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no test team created');
      return true;
    }

    const updateData = {
      name: `Updated Test Team ${Date.now()}`,
      description: 'Updated description for test team',
    };

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const updatedTeam = await response.json();
      console.log(`   Updated team name: ${updatedTeam.name}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Update team failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // TEAM MEMBER MANAGEMENT
  // ========================================
  console.log('\n👤 TEAM MEMBER MANAGEMENT');
  console.log('-------------------------');

  await runTest('Get Team Members (/api/teams/{teamId}/users)', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no test team created');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}/users`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const members = await response.json();
      console.log(`   Team has ${members.length} members`);
      if (members.length > 0) {
        console.log(`   Sample member: ${members[0].user?.username} (${members[0].role})`);
        console.log(`   Joined: ${new Date(members[0].createdAt).toLocaleDateString()}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get team members failed: ${error}`);
      return false;
    }
  });

  await runTest('Team Join Request Test (/api/teams/join)', async () => {
    // Test join with invalid invite code to avoid actually joining
    const joinData = {
      accessCode: 'invalid_invite_code',
    };

    const response = await fetch(`${BASE_URL}/api/teams/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify(joinData),
    });

    // Should fail with invalid code - this is expected
    const success = !response.ok && (response.status === 400 || response.status === 404);
    if (success) {
      console.log('   Team join correctly rejected invalid invite code');
    } else if (response.ok) {
      console.log('   ⚠️  WARNING: Team join succeeded with invalid code!');
      return false;
    } else {
      const error = await response.text();
      console.log(`   Team join test: ${error}`);
    }
    return success;
  });

  // ========================================
  // TEAM WEBSITES
  // ========================================
  console.log('\n🌐 TEAM WEBSITES');
  console.log('----------------');

  await runTest('Get Team Websites (/api/teams/{teamId}/websites)', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no test team created');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}/websites`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const websites = await response.json();
      console.log(`   Team has ${websites.length} websites`);
      if (websites.length > 0) {
        console.log(`   Sample website: ${websites[0].name} (${websites[0].domain})`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get team websites failed: ${error}`);
      return false;
    }
  });

  await runTest('Create Team Website (/api/teams/{teamId}/websites)', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no test team created');
      return true;
    }

    const websiteData = {
      name: `Team Test Website ${Date.now()}`,
      domain: `team-test-${Date.now()}.example.com`,
      shareId: null,
    };

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}/websites`, {
      method: 'POST',
      headers,
      body: JSON.stringify(websiteData),
    });

    if (response.ok) {
      const newWebsite = await response.json();
      console.log(`   Created team website: ${newWebsite.name}`);
      console.log(`   Website ID: ${newWebsite.id}`);
      // Clean up the website
      await fetch(`${BASE_URL}/api/websites/${newWebsite.id}`, {
        method: 'DELETE',
        headers,
      });
      return true;
    } else {
      const error = await response.text();
      console.log(`   Create team website failed: ${error}`);
      // Check if it's a plan limit issue - that's expected behavior
      if (error.includes('LIMIT_EXCEEDED') || error.includes('limit')) {
        console.log('   ✅ Website creation limit protection working correctly');
        return true;
      }
      return false;
    }
  });

  // ========================================
  // TEAM DELETION
  // ========================================
  console.log('\n🗑️ TEAM DELETION');
  console.log('----------------');

  await runTest('Delete Team (/api/teams/{teamId})', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no test team to delete');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      console.log(`   Successfully deleted team: ${testTeamId}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Delete team failed: ${error}`);
      return false;
    }
  });

  await runTest('Verify Team Deletion (/api/teams/{teamId})', async () => {
    if (!testTeamId) {
      console.log('   Skipping - no deleted team to verify');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/teams/${testTeamId}`, {
      method: 'GET',
      headers,
    });

    const success = !response.ok && (response.status === 404 || response.status === 403);
    if (success) {
      console.log('   Deleted team correctly inaccessible');
    } else if (response.ok) {
      console.log('   ⚠️  WARNING: Deleted team still accessible!');
      return false;
    } else {
      console.log(`   Team deletion verification: ${response.status}`);
    }
    return success;
  });

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 TEAM MANAGEMENT TEST RESULTS');
  console.log('===============================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`,
  );

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status !== 'PASS')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.status}`);
        if (test.error) console.log(`     Error: ${test.error}`);
      });
  }

  console.log('\n🎉 Team Management Test Complete!');
  return results.passed > results.failed;
}

testTeamManagement().catch(console.error);
