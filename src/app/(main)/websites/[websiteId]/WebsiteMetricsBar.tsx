import { Dropdown, Item } from 'react-basics';
import classNames from 'classnames';
import { useDateRange, useMessages, useSticky } from '@/components/hooks';
import WebsiteDateFilter from '@/components/input/WebsiteDateFilter';
import MetricCard from '@/components/metrics/MetricCard';
import MetricsBar from '@/components/metrics/MetricsBar';
import { formatShortTime, formatLongNumber } from '@/lib/format';
import useWebsiteStats from '@/components/hooks/queries/useWebsiteStats';
import useStore, { setWebsiteDateCompare } from '@/store/websites';
import WebsiteFilterButton from './WebsiteFilterButton';
import styles from './WebsiteMetricsBar.module.css';

export function WebsiteMetricsBar({
  websiteId,
  sticky,
  showChange = false,
  compareMode = false,
  showFilter = false,
}: {
  websiteId: string;
  sticky?: boolean;
  showChange?: boolean;
  compareMode?: boolean;
  showFilter?: boolean;
}) {
  const { dateRange } = useDateRange(websiteId);
  const { formatMessage, labels } = useMessages();
  const dateCompare = useStore(state => state[websiteId]?.dateCompare);
  const { ref, isSticky } = useSticky({ enabled: sticky });
  const { data, isLoading, isFetched, error } = useWebsiteStats(
    websiteId,
    compareMode && dateCompare,
  );
  const isAllTime = dateRange.value === 'all';

  const { pageviews, visitors, visits, bounces, totaltime } = data || {};

  const metrics = data
    ? [
        {
          ...pageviews,
          label: formatMessage(labels.views),
          change: (pageviews?.value || 0) - (pageviews?.prev || 0),
          formatValue: formatLongNumber,
        },
        {
          ...visits,
          label: formatMessage(labels.visits),
          change: (visits?.value || 0) - (visits?.prev || 0),
          formatValue: formatLongNumber,
        },
        {
          ...visitors,
          label: formatMessage(labels.visitors),
          change: (visitors?.value || 0) - (visitors?.prev || 0),
          formatValue: formatLongNumber,
        },
        {
          label: formatMessage(labels.bounceRate),
          value:
            (visits?.value || 0) > 0
              ? (Math.min(visits.value || 0, bounces?.value || 0) / visits.value) * 100
              : 0,
          prev:
            (visits?.prev || 0) > 0
              ? (Math.min(visits.prev || 0, bounces?.prev || 0) / visits.prev) * 100
              : 0,
          change:
            (visits?.value || 0) > 0 && (visits?.prev || 0) > 0
              ? (Math.min(visits.value || 0, bounces?.value || 0) / visits.value) * 100 -
                (Math.min(visits.prev || 0, bounces?.prev || 0) / visits.prev) * 100
              : 0,
          formatValue: n => Math.round(+(n || 0)) + '%',
          reverseColors: true,
        },
        {
          label: formatMessage(labels.visitDuration),
          value: (visits?.value || 0) > 0 ? (totaltime?.value || 0) / visits.value : 0,
          prev: (visits?.prev || 0) > 0 ? (totaltime?.prev || 0) / visits.prev : 0,
          change:
            (visits?.value || 0) > 0 && (visits?.prev || 0) > 0
              ? (totaltime?.value || 0) / visits.value - (totaltime?.prev || 0) / visits.prev
              : 0,
          formatValue: n =>
            `${+(n || 0) < 0 ? '-' : ''}${formatShortTime(Math.abs(~~(n || 0)), ['m', 's'], ' ')}`,
        },
      ]
    : [];

  const items = [
    { label: formatMessage(labels.previousPeriod), value: 'prev' },
    { label: formatMessage(labels.previousYear), value: 'yoy' },
  ];

  return (
    <div
      ref={ref}
      className={classNames(styles.container, {
        [styles.sticky]: sticky,
        [styles.isSticky]: sticky && isSticky,
      })}
    >
      <div>
        <MetricsBar isLoading={isLoading} isFetched={isFetched} error={error}>
          {metrics.map(({ label, value, prev, change, formatValue, reverseColors }) => {
            return (
              <MetricCard
                key={label}
                value={value}
                previousValue={prev}
                label={label}
                change={change}
                formatValue={formatValue}
                reverseColors={reverseColors}
                showChange={!isAllTime && (compareMode || showChange)}
                showPrevious={!isAllTime && compareMode}
              />
            );
          })}
        </MetricsBar>
      </div>
      <div className={styles.actions}>
        {showFilter && <WebsiteFilterButton websiteId={websiteId} />}
        <WebsiteDateFilter websiteId={websiteId} showAllTime={!compareMode} />
        {compareMode && (
          <div className={styles.vs}>
            <b>VS</b>
            <Dropdown
              className={styles.dropdown}
              items={items}
              value={dateCompare || 'prev'}
              renderValue={value => items.find(i => i.value === value)?.label}
              alignment="end"
              onChange={(value: any) => setWebsiteDateCompare(websiteId, value)}
            >
              {items.map(({ label, value }) => (
                <Item key={value}>{label}</Item>
              ))}
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default WebsiteMetricsBar;
