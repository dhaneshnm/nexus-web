import * as React from 'react';
import { Card, Icon, Button, Tooltip, Skeleton, Spin } from 'antd';
import { Meta } from 'antd/lib/list/Item';
import * as moment from 'moment';
import UserAvatar from '../User/Avatar';
import TypesIcon from '../Types/TypesIcon';
import Copy from '../Copy';
import './metadata-card.less';
import { NexusFile, Resource } from '@bbp/nexus-sdk';
import { hasDisplayableImage } from './ResourcePreview';
import useNexusFile from '../hooks/useNexusFile';

export interface ResourceMetadataCardProps {
  resource: Resource;
  showPreview?: boolean;
  getFilePreview: (selfUrl: string) => Promise<NexusFile>;
}

const ResourceMetadataCard: React.FunctionComponent<
  ResourceMetadataCardProps
> = props => {
  const {
    showPreview = false,
    resource: {
      rev,
      type,
      id,
      self,
      constrainedBy,
      name,
      createdAt,
      updatedAt,
      createdBy,
    },
    getFilePreview,
  } = props;
  let userName;
  if (createdBy.length === 0) {
    userName = 'Unknown';
  } else {
    try {
      [userName] = createdBy.split('/').slice(-1);
    } catch (e) {
      userName = createdBy;
    }
  }
  const { file, loading: fileLoading, hasFileInResource } = useNexusFile(
    props.resource,
    hasDisplayableImage,
    getFilePreview
  );

  const makeCover = () => {
    if (showPreview && hasFileInResource) {
      if (fileLoading) {
        return (
          <div className="cover">
            <div className="wrapper -loading">
              <div className="skeleton" />
            </div>
          </div>
        );
      }
      if (file) {
        const img = new Image();
        img.src = `data:${file.mediaType};base64,${file.rawFile as string}`;
        return (
          <div className="cover">
            <div
              className="wrapper"
              style={{ backgroundImage: `url(${img.src})` }}
            >
              <img src={img.src} />
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Card className="metadata-card" cover={makeCover()}>
      <Meta
        avatar={<UserAvatar createdBy={createdBy} />}
        title={
          <div
            className="name"
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <div style={{ marginRight: '1em' }}>
              <Tooltip title={self}>
                <em style={{ fontSize: '1.2em', marginRight: '4px' }}>
                  {name}
                </em>
              </Tooltip>
              <Copy
                textToCopy={id}
                render={(copySuccess, triggerCopy) => (
                  <Tooltip title={copySuccess ? 'Copied!' : 'Copy Identifier'}>
                    <Button
                      style={{ margin: '0 1em' }}
                      size="small"
                      icon={copySuccess ? 'check' : 'copy'}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerCopy();
                      }}
                    >
                      Identifier
                    </Button>
                  </Tooltip>
                )}
              />

              <Copy
                textToCopy={self}
                render={(copySuccess, triggerCopy) => (
                  <Tooltip
                    title={copySuccess ? 'Copied!' : 'Copy Nexus Address'}
                  >
                    <Button
                      size="small"
                      icon={copySuccess ? 'check' : 'copy'}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerCopy();
                      }}
                    >
                      Nexus Address
                    </Button>
                  </Tooltip>
                )}
              />
            </div>
          </div>
        }
        description={
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 22 }}>
              {!!type && <TypesIcon type={type} full={true} />}
            </div>
            <div>
              created by <b>{userName}</b> on{' '}
              {moment(createdAt).format('DD/MM/YYYY')}
            </div>
            <div>
              <Icon type="file-sync" /> <em>revision: {rev}</em>{' '}
              {updatedAt !== createdAt && (
                <span>, last updated {moment(updatedAt).fromNow()}</span>
              )}
            </div>
            <div>
              schema:{' '}
              <a href={constrainedBy} target="_blank">
                {constrainedBy}
              </a>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default ResourceMetadataCard;
