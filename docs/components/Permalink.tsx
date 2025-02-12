import { css } from '@emotion/react';
import * as React from 'react';

import { AdditionalProps } from '~/common/headingManager';
import PermalinkIcon from '~/components/icons/Permalink';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { LinkBase } from '~/ui/components/Text';

type BaseProps = React.PropsWithChildren<{
  component: any;
  className?: string;
}>;

type EnhancedProps = React.PropsWithChildren<{
  // Sidebar heading level override
  nestingLevel?: number;
  additionalProps?: AdditionalProps;
  id?: string;
}>;

const STYLES_PERMALINK_TARGET = css`
  display: block;
  position: absolute;
  top: -46px;
  visibility: hidden;
`;

const STYLES_PERMALINK_LINK = css`
  position: relative;
  color: inherit;
  text-decoration: none !important;

  /* Disable link when used in collapsible, to allow expand on click */
  details & {
    pointer-events: none;
  }
`;

const STYLED_PERMALINK_CONTENT = css`
  display: inline;
`;

const STYLES_PERMALINK_ICON = css`
  cursor: pointer;
  vertical-align: text-top;
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  padding: 0 0.2em;
  visibility: hidden;

  a:hover & {
    visibility: visible;
  }

  svg {
    width: 100%;
    height: auto;
  }
`;

const PermalinkBase = ({ component, children, className, ...rest }: BaseProps) =>
  React.cloneElement(
    component,
    {
      className: [className, component.props.className || ''].join(' '),
      ...rest,
    },
    children
  );

const Permalink: React.FC<EnhancedProps> = withHeadingManager(
  (props: EnhancedProps & HeadingManagerProps) => {
    // NOTE(jim): Not the greatest way to generate permalinks.
    // for now I've shortened the length of permalinks.
    const component = props.children as JSX.Element;
    const children = component.props.children || '';

    const heading = props.nestingLevel
      ? props.headingManager.addHeading(
          children,
          props.nestingLevel,
          props.additionalProps,
          props.id
        )
      : undefined;
    const permalinkKey = props.id ?? heading?.slug;

    return (
      <PermalinkBase component={component} data-components-heading>
        <LinkBase css={STYLES_PERMALINK_LINK} href={'#' + permalinkKey} ref={heading?.ref}>
          <span css={STYLES_PERMALINK_TARGET} id={permalinkKey} />
          <span css={STYLED_PERMALINK_CONTENT}>{children}</span>
          <span css={STYLES_PERMALINK_ICON}>
            <PermalinkIcon />
          </span>
        </LinkBase>
      </PermalinkBase>
    );
  }
);

export default Permalink;
