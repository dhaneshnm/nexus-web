import * as React from 'react';
import { Menu, Dropdown, Icon, Button, Popover } from 'antd';
import './Header.less';
import Copy from '../Copy';

const logo = require('../../logo.svg');
const epflLogo = require('../../EPFL-logo.svg');

interface InformationContentProps {
  version: string;
  githubIssueURL: string;
}

const InformationContent = (props: InformationContentProps) => {
  return (
    <>
      <p>Nexus is Open Source and available under the Apache 2 License. </p>
      <p>
        v{props.version}{' '}
        <a href={props.githubIssueURL} target="_blank">
          <Icon type="github" /> post an issue on github
        </a>
      </p>
      <p>
        © 2017-2019
        <a href="https://www.epfl.ch/" target="_blank">
          <img
            style={{ width: '3em', marginBottom: 3 }}
            src={epflLogo}
            alt="EPFL"
          />
        </a>
        {'| '}
        <a href="https://bluebrain.epfl.ch/" target="_blank">
          <span className="bbp-logo">Blue Brain Project</span>
        </a>
      </p>
    </>
  );
};
export interface HeaderProps {
  version: string;
  githubIssueURL: string;
  name?: string;
  token?: string;
  links?: React.ReactNode[];
  displayLogin?: boolean;
  children?: React.ReactChild;
  onLoginClick?(): void;
  visitHome?(): void;
}

const Header: React.FunctionComponent<HeaderProps> = ({
  name,
  token,
  displayLogin = true,
  links = [],
  children,
  onLoginClick,
  version,
  githubIssueURL,
  visitHome,
}) => {
  const menu = (
    <Menu>
      {links.map((link, i) => (
        <Menu.Item key={i}>{link}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <header className="Header">
      <div className="selectors">{children}</div>
      <div className="logo-block">
        <a
          className="logo"
          href=""
          onClick={e => {
            if (visitHome) {
              e.preventDefault();
              visitHome();
            }
          }}
        >
          {
            // must add inline styling to prevent this big svg from
            // flashing the screen on dev mode before styles are loaded
          }
          <img style={{ height: '2em', width: '2em' }} src={logo} alt="Nexus" />
          <h1>Nexus</h1>
        </a>
      </div>
      <div className="menu-block">
        {token && (
          <Copy
            textToCopy={token}
            render={(copySuccess, triggerCopy) => (
              <Button size="small" icon="copy" onClick={() => triggerCopy()}>
                {copySuccess ? 'Token copied!' : 'Copy token'}
              </Button>
            )}
          />
        )}
        <Popover
          content={
            <InformationContent
              version={version}
              githubIssueURL={githubIssueURL}
            />
          }
          trigger="click"
          title="Information"
          placement="bottomRight"
        >
          <Button size="small" icon="info-circle" />
        </Popover>
        {name ? (
          <Dropdown overlay={menu}>
            <a className="menu-dropdown ant-dropdown-link">
              {name} <Icon type="down" />
            </a>
          </Dropdown>
        ) : displayLogin ? (
          <a className="menu-dropdown ant-dropdown-link" onClick={onLoginClick}>
            login <Icon type="login" />
          </a>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
