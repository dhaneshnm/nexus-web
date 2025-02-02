import * as React from 'react';
import { Timeline, Card, Icon } from 'antd';
import { Resource } from '@bbp/nexus-sdk-legacy';
import { diff } from 'deep-object-diff';
import moment = require('moment');
import { getUsername, blacklistKeys } from '../../utils';
import { Revisions } from '../../store/actions/nexus/revisions';
import './History.less';

export interface HistoryProps {
  resource: Resource;
  listRevisions(resource: Resource): Promise<Revisions>;
}

const History: React.FunctionComponent<HistoryProps> = props => {
  const { resource, listRevisions } = props;
  const [revisions, setRevisions] = React.useState<Revisions>([]);

  React.useEffect(() => {
    listRevisions(resource)
      .then(setRevisions)
      .catch(error => {
        // do something?
      });
  }, [resource.id]);

  const userName = getUsername(resource.createdBy);

  const history = revisions
    .map((revision: any, index: number) => {
      if (index === 0) {
        return (
          <Timeline.Item className="created-at" dot={<Icon type="star" />}>
            <div>
              created by <b>{userName}</b> on{' '}
              {moment(resource.createdAt).format('DD/MM/YYYY')}
            </div>
          </Timeline.Item>
        );
      }

      const metadataKeys = ['_rev', '_updatedAt', '_updatedBy'];

      const previous = blacklistKeys(revisions[index - 1], metadataKeys);
      const current = blacklistKeys(revision, metadataKeys);

      const changes = diff(current, previous);

      const hasChanges = JSON.stringify(changes, null, 2) !== '{}';

      return (
        <Timeline.Item color={hasChanges ? 'blue' : 'red'}>
          <div>
            updated by <b>{getUsername(revision._updatedBy)}</b> on{' '}
            {moment(revision.updatedAt).format('DD/MM/YYYY')}
            <div
              className="changes"
              style={{ width: 'max-content', marginTop: '1em' }}
            >
              {hasChanges ? (
                <Card>{JSON.stringify(changes, null, 2)}</Card>
              ) : (
                'No meaningful changes'
              )}
            </div>
          </div>
        </Timeline.Item>
      );
    })
    .reverse();

  return <Timeline style={{ padding: '1em' }}>{history}</Timeline>;
};

export default History;
