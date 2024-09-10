// @flow

import * as React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import classes from './CompactTextField.module.css';
import { tooltipEnterDelay } from '../Tooltip';
import useClickDragAsControl from './UseClickDragAsControl';
import { makeTimestampedId } from '../../Utils/TimestampedId';
import { toFixedWithoutTrailingZeros } from '../../Utils/Mathematics';

type ValueProps =
  | {|
      type?: 'text',
      value: string,
      onChange: (newValue: string, reason: 'keyInput' | 'iconControl') => void,
    |}
  | {|
      type: 'number',
      value: ?number, // null value corresponds to an empty input.
      onChange: (newValue: string, reason: 'keyInput' | 'iconControl') => void,
    |};

type OtherProps = {|
  onBlur?: ({
    currentTarget: {
      value: string,
    },
  }) => void,
  onFocus?: ({
    currentTarget: {
      value: string,
    },
    preventDefault: () => void,
  }) => void,
|};

export type CompactTextFieldInterface = {|
  blur: () => void,
|};

export type CompactTextFieldProps = {|
  ...ValueProps,
  ...OtherProps,
  id?: string,
  disabled?: boolean,
  errored?: boolean,
  placeholder?: string,
  renderLeftIcon?: (className: string) => React.Node,
  leftIconTooltip?: React.Node,
  useLeftIconAsNumberControl?: boolean,
  renderEndAdornmentOnHover?: (className: string) => React.Node,
  onClickEndAdornment?: () => void,
  onKeyDown?: KeyboardEvent => void,
  onKeyUp?: KeyboardEvent => void,
  onWheel?: WheelEvent => void,
|};

const CompactTextField = React.forwardRef<
  CompactTextFieldProps,
  CompactTextFieldInterface
>(
  (
    {
      type,
      value,
      onChange,
      id,
      disabled,
      errored,
      placeholder,
      renderLeftIcon,
      leftIconTooltip,
      useLeftIconAsNumberControl,
      renderEndAdornmentOnHover,
      onClickEndAdornment,
      onBlur,
      onFocus,
      onKeyDown,
      onKeyUp,
      onWheel,
    },
    ref
  ) => {
    const idToUse = React.useRef<string>(id || makeTimestampedId());
    const inputRef = React.useRef<?HTMLInputElement>(null);
    const controlProps = useClickDragAsControl({
      onChange: (value: number) => onChange(value.toString(), 'iconControl'),
      onGetInitialValue: () => parseFloat(value),
    });
    const [isFocused, setIsFocused] = React.useState<boolean>(false);

    const onBlurInput = React.useCallback(
      event => {
        setIsFocused(false);
        if (onBlur) onBlur(event);
      },
      [onBlur]
    );
    const onFocusInput = React.useCallback(
      event => {
        setIsFocused(true);
        if (onFocus) onFocus(event);
      },
      [onFocus]
    );

    React.useImperativeHandle(ref, () => ({
      blur: () => {
        if (inputRef.current) inputRef.current.blur();
      },
    }));

    // The wheel event is added manually, instead of using the `onWheel` prop,
    // because by default the `onWheel` is registered as a passive event listener,
    // which prevents us to use `preventDefault` on the event, which is needed
    // when we want to avoid the page to scroll when the user is scrolling on the input.
    React.useEffect(
      () => {
        const input = inputRef.current;
        if (input && onWheel) {
          // Do not allow the wheel event to be listened if the input is not focused.
          // This is to avoid scrolling the input accidentally when the user is scrolling the page.
          if (isFocused) {
            input.addEventListener('wheel', onWheel, {
              passive: false,
            });
          } else {
            input.removeEventListener('wheel', onWheel, {
              passive: false,
            });
          }
        }

        return () => {
          if (input && onWheel) {
            input.removeEventListener('wheel', onWheel, {
              passive: false,
            });
          }
        };
      },
      [onWheel, isFocused]
    );

    return (
      <div
        className={classNames({
          [classes.container]: true,
          [classes.disabled]: disabled,
          [classes.errored]: errored,
        })}
      >
        {renderLeftIcon && leftIconTooltip && (
          <Tooltip
            title={leftIconTooltip}
            enterDelay={tooltipEnterDelay}
            placement="bottom"
            PopperProps={{
              modifiers: {
                offset: {
                  enabled: true,
                  /**
                   * It does not seem possible to get the tooltip closer to the anchor
                   * when positioned on top. So it is positioned on bottom with a negative offset.
                   */
                  offset: '0,-20',
                },
              },
            }}
          >
            <div
              className={classNames({
                [classes.leftIconContainer]: true,
                [classes.control]: !!useLeftIconAsNumberControl,
              })}
              {...(useLeftIconAsNumberControl ? controlProps : {})}
            >
              <label htmlFor={idToUse.current} className={classes.label}>
                {renderLeftIcon(classes.leftIcon)}
              </label>
            </div>
          </Tooltip>
        )}
        <div
          className={classNames({
            [classes.compactTextField]: true,
            [classes.withEndAdornment]: !!renderEndAdornmentOnHover,
          })}
        >
          <input
            id={idToUse.current}
            // Type cannot be set to number in order to benefit from the mathematical parsing.
            type={'text'}
            ref={inputRef}
            disabled={disabled}
            value={
              value === null
                ? ''
                : typeof value === 'number'
                ? toFixedWithoutTrailingZeros(value, 2)
                : value
            }
            onChange={e => onChange(e.currentTarget.value, 'keyInput')}
            placeholder={placeholder}
            onBlur={onBlurInput}
            onFocus={onFocusInput}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
          {renderEndAdornmentOnHover && (
            <button
              onClick={onClickEndAdornment}
              className={classes.endAdornmentButton}
            >
              {renderEndAdornmentOnHover(classes.endAdornmentIcon)}
            </button>
          )}
        </div>
      </div>
    );
  }
);

export default CompactTextField;
