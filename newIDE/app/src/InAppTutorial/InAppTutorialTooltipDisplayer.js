// @flow
import * as React from 'react';
import Popper from '@material-ui/core/Popper';
import Fade from '@material-ui/core/Fade';
import Typography from '@material-ui/core/Typography';
import { Column, LargeSpacer } from '../UI/Grid';
import { getDisplayZIndexForHighlighter } from './HTMLUtils';
import InAppTutorialContext, {
  type InAppTutorialFormattedTooltip,
} from './InAppTutorialContext';
import ChevronArrowBottom from '../UI/CustomSvgIcons/ChevronArrowBottom';
import useIsElementVisibleInScroll from '../Utils/UseIsElementVisibleInScroll';
import { makeStyles } from '@material-ui/core/styles';
import { MarkdownText } from '../UI/MarkdownText';
import RaisedButton from '../UI/RaisedButton';
import IconButton from '../UI/IconButton';
import GDevelopThemeContext from '../UI/Theme/ThemeContext';
import Paper from '@material-ui/core/Paper';

type Props = {|
  anchorElement: HTMLElement,
  tooltip: InAppTutorialFormattedTooltip,
  buttonLabel?: string,
|};

const styles = {
  paper: {
    padding: '0px 30px 0px 20px', // vertical padding is added by markdown text paragraphs
  },
  title: {
    color: '#1D1D26', // Grey100
  },
  description: {
    color: '#494952', // Grey70
  },
  divider: {
    backgroundColor: '#D9D9DE', // Grey20
    height: 1,
  },
  descriptionImage: {
    margin: 'auto',
  },
  sideButton: { cursor: 'pointer' },
  sideButtonsContainer: {
    position: 'absolute',
    right: 3,
    top: 8,
    color: '#494952',
    display: 'flex',
    flexDirection: 'column',
  },
};

const useClasses = makeStyles({
  popper: {
    '&[x-placement*="bottom"] #arrow-popper': {
      top: 0,
      left: 0,
      marginTop: '-0.71em',
      marginLeft: 4,
      marginRight: 4,
      '&::before': {
        transformOrigin: '0 100%',
      },
    },
    '&[x-placement*="top"] #arrow-popper': {
      bottom: 0,
      left: 0,
      marginBottom: '-0.71em',
      marginLeft: 4,
      marginRight: 4,
      '&::before': {
        transformOrigin: '100% 0',
      },
    },
    '&[x-placement*="right"] #arrow-popper': {
      left: 0,
      marginLeft: '-0.71em',
      height: '1em',
      width: '0.71em',
      marginTop: 4,
      marginBottom: 4,
      '&::before': {
        transformOrigin: '100% 100%',
      },
    },
    '&[x-placement*="left"] #arrow-popper': {
      right: 0,
      marginRight: '-0.71em',
      height: '1em',
      width: '0.71em',
      marginTop: 4,
      marginBottom: 4,
      '&::before': {
        transformOrigin: '0 0',
      },
    },
  },
  arrow: {
    overflow: 'hidden',
    position: 'absolute',
    width: '1em',
    /* = width / sqrt(2) = (length of the hypotenuse) */
    height: '0.71em',
    boxSizing: 'border-box',
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: '100%',
      height: '100%',
      backgroundColor: 'currentColor',
      transform: 'rotate(45deg)',
    },
  },
});

export type InAppTutorialTooltipDisplayerInterface = {|
  showTooltip: () => void,
|};

const InAppTutorialTooltipDisplayer = React.forwardRef<
  Props,
  InAppTutorialTooltipDisplayerInterface
>(({ anchorElement, tooltip, buttonLabel }, ref) => {
  const {
    palette: { type: paletteType },
  } = React.useContext(GDevelopThemeContext);
  const [show, setShow] = React.useState<boolean>(false);
  const { goToNextStep } = React.useContext(InAppTutorialContext);
  const updateVisibility = React.useCallback(
    (entries: IntersectionObserverEntry[]) => {
      setShow(entries[0].isIntersecting);
    },
    []
  );

  React.useImperativeHandle(ref, () => ({
    showTooltip: () => {
      if (tooltip.standalone && !show) {
        setShow(true);
      }
    },
  }));

  // If tooltip changes, we reopen the tooltip anyway.
  React.useEffect(
    () => {
      setShow(true);
    },
    [tooltip]
  );

  useIsElementVisibleInScroll(anchorElement, updateVisibility);

  const arrowRef = React.useRef<?HTMLSpanElement>(null);
  const classes = useClasses();
  const placement = tooltip.placement || 'bottom';
  const backgroundColor =
    paletteType === 'light'
      ? '#EBEBED' // Grey10
      : '#FAFAFA'; // Grey00

  return (
    <>
      <Popper
        id="in-app-tutorial-tooltip-displayer"
        open={show}
        className={classes.popper}
        anchorEl={anchorElement}
        transition
        placement={placement}
        popperOptions={{
          modifiers: {
            arrow: { enabled: true, element: '#arrow-popper' },
            offset: {
              enabled: true,
              offset: '0,10',
            },
          },
        }}
        style={{
          zIndex: getDisplayZIndexForHighlighter(anchorElement),
          maxWidth: 300,
        }}
      >
        {({ TransitionProps }) => (
          <>
            <Fade {...TransitionProps} timeout={{ enter: 350, exit: 0 }}>
              <Paper style={{ ...styles.paper, backgroundColor }} elevation={4}>
                <Column noMargin>
                  {tooltip.title && (
                    <Typography style={styles.title} variant="subtitle1">
                      <MarkdownText source={tooltip.title} allowParagraphs />
                    </Typography>
                  )}
                  {tooltip.title &&
                    (tooltip.description || tooltip.getDescriptionNode) && (
                      <span style={styles.divider} />
                    )}
                  {tooltip.getDescriptionNode &&
                    tooltip.getDescriptionNode(styles.description)}
                  {tooltip.description && !tooltip.getDescriptionNode && (
                    <Typography style={styles.description}>
                      <MarkdownText
                        source={tooltip.description}
                        allowParagraphs
                      />
                    </Typography>
                  )}
                  {tooltip.image && (
                    <>
                      <img
                        src={tooltip.image.dataUrl}
                        alt="Tutorial helper"
                        style={{
                          ...styles.descriptionImage,
                          width: tooltip.image.width || '100%',
                        }}
                      />
                      <LargeSpacer />
                    </>
                  )}
                  {buttonLabel && (
                    <>
                      <RaisedButton
                        primary
                        label={buttonLabel}
                        onClick={goToNextStep}
                      />
                      <LargeSpacer />
                    </>
                  )}
                </Column>
                <span
                  id="arrow-popper"
                  className={classes.arrow}
                  ref={arrowRef}
                  style={{ color: backgroundColor }}
                />
                <div style={styles.sideButtonsContainer}>
                  {tooltip.standalone ? (
                    // Display the hide button only if standalone because the only
                    // way to show it back is to click on the avatar (through
                    // ref handle method).
                    <IconButton
                      size="small"
                      useCurrentColor
                      style={styles.sideButton}
                      onClick={() => setShow(false)}
                    >
                      <ChevronArrowBottom />
                    </IconButton>
                  ) : null}
                </div>
              </Paper>
            </Fade>
          </>
        )}
      </Popper>
    </>
  );
});

export default InAppTutorialTooltipDisplayer;
