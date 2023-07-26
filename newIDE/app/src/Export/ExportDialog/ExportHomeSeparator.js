// @flow
import React from 'react';
import { Column } from '../../UI/Grid';
import { useResponsiveWindowWidth } from '../../UI/Reponsive/ResponsiveWindowMeasurer';
import GDevelopThemeContext from '../../UI/Theme/GDevelopThemeContext';

const ExportHomeSeparator = () => {
  const windowWidth = useResponsiveWindowWidth();
  const isSmall = windowWidth === 'small';
  const theme = React.useContext(GDevelopThemeContext);
  return (
    !isSmall && (
      <Column justifyContent="center" noMargin>
        <span
          style={{
            height: 'calc(100% - 30px)',
            borderLeftStyle: 'solid',
            borderLeftWidth: 1,
            borderColor: theme.toolbar.separatorColor,
          }}
        />
      </Column>
    )
  );
};

export default ExportHomeSeparator;
