// @flow
import { Trans } from '@lingui/macro';
import * as React from 'react';
import FlatButton from '../../UI/FlatButton';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Dialog from '../../UI/Dialog';
import { mapFor } from '../../Utils/MapFor';
import Text from '../../UI/Text';
import BackgroundText from '../../UI/BackgroundText';
import { Line, Column } from '../../UI/Grid';

export type ExternalProperties = {|
  layoutName: string,
|};

type Props = {|
  open: boolean,
  onChoose: ExternalProperties => void,
  layoutName?: ?string,
  onClose: () => void,
  project: gdProject,
  title?: React.Node,
  helpTexts?: Array<React.Node>,
|};

export default function ExternalPropertiesDialog({
  open,
  onChoose,
  layoutName,
  onClose,
  project,
  title,
  helpTexts,
}: Props) {
  const initialLayoutName = layoutName || '';
  const [selectedLayoutName, setSelectedLayoutName] = React.useState<string>(
    initialLayoutName
  );
  const onClick = React.useCallback(
    () => {
      const externalProperties: ExternalProperties = {
        layoutName: selectedLayoutName,
      };
      onChoose(externalProperties);
    },
    [onChoose, selectedLayoutName]
  );

  const actions = [
    <FlatButton
      key="cancel"
      label={<Trans>Cancel</Trans>}
      primary={false}
      onClick={onClose}
    />,
    <FlatButton
      key="choose"
      label={<Trans>Choose</Trans>}
      primary
      keyboardFocused
      onClick={onClick}
      disabled={!selectedLayoutName}
    />,
  ];

  const layoutNames = mapFor(0, project.getLayoutsCount(), i => {
    return project.getLayoutAt(i).getName();
  });

  return (
    <Dialog
      actions={actions}
      open={open}
      title={title}
      onRequestClose={onClose}
      cannotBeDismissed={false}
      maxWidth="sm"
      onSubmit="lastAction"
    >
      <Column>
        {helpTexts &&
          helpTexts.map(helpText => (
            <Line>
              <BackgroundText>{helpText}</BackgroundText>
            </Line>
          ))}
        <Line>
          <Text>
            <Trans>Choose the associated scene:</Trans>
          </Text>
        </Line>
        <RadioGroup
          aria-label="Associated scene"
          name="associated-layout"
          value={selectedLayoutName}
          onChange={event => setSelectedLayoutName(event.target.value)}
        >
          {layoutNames.map(name => (
            <FormControlLabel
              key={name}
              value={name}
              control={<Radio color="primary" />}
              label={name}
            />
          ))}
        </RadioGroup>
      </Column>
    </Dialog>
  );
}
