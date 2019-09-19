// @flow
import { Trans } from '@lingui/macro';
import { t } from '@lingui/macro';
import { I18n } from '@lingui/react';
import { type I18n as I18nType } from '@lingui/core';
import * as React from 'react';
import { Column, Line } from '../UI/Grid';
import SelectField from '../UI/SelectField';
import SelectOption from '../UI/SelectOption';
import { mapVector } from '../Utils/MapFor';
import RaisedButton from '../UI/RaisedButton';
import IconButton from '../UI/IconButton';
import EmptyMessage from '../UI/EmptyMessage';
import ElementWithMenu from '../UI/Menu/ElementWithMenu';
import MoreVert from '@material-ui/icons/MoreVert';
import SemiControlledTextField from '../UI/SemiControlledTextField';
import MiniToolbar from '../UI/MiniToolbar';
import { showWarningBox } from '../UI/Messages/MessageBox';
import newNameGenerator from '../Utils/NewNameGenerator';
import InlineCheckbox from '../UI/InlineCheckbox';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Add from '@material-ui/icons/Add';

const gd = global.gd;

type Props = {|
  project: gdProject,
  eventsBasedBehavior: gdEventsBasedBehavior,
  onPropertiesUpdated: () => void,
  onRenameProperty: (oldName: string, newName: string) => void,
|};

const styles = {
  propertiesContainer: {
    flex: 1,
  },
};

const validatePropertyName = (
  i18n: I18nType,
  properties: gdNamedPropertyDescriptorsList,
  newName: string
) => {
  if (!newName) {
    showWarningBox(i18n._(t`The name of a property cannot be empty.`));
    return false;
  }
  if (newName === 'name' || newName === 'type') {
    showWarningBox(
      i18n._(
        t`The name of a property cannot be "name" or "type", as they are used by GDevelop internally.`
      )
    );
    return false;
  }
  if (properties.has(newName)) {
    showWarningBox(
      i18n._(
        t`This name is already used by another property. Choose a unique name for each property.`
      )
    );
    return false;
  }
  if (!gd.Project.validateObjectName(newName)) {
    showWarningBox(
      i18n._(
        t`This name contains forbidden characters: please only use alphanumeric characters (0-9, a-z) and underscores in your parameter name.`
      )
    );
    return false;
  }

  return true;
};

export default class EventsBasedBehaviorPropertiesEditor extends React.Component<
  Props,
  {||}
> {
  _addProperty = () => {
    const { eventsBasedBehavior } = this.props;
    const properties = eventsBasedBehavior.getPropertyDescriptors();

    const newName = newNameGenerator('Property', name => properties.has(name));
    const property = properties.insertNew(newName, properties.getCount());
    property.setType('Number');
    this.forceUpdate();
    this.props.onPropertiesUpdated();
  };

  _removeProperty = (name: string) => {
    const { eventsBasedBehavior } = this.props;
    const properties = eventsBasedBehavior.getPropertyDescriptors();

    properties.remove(name);
    this.forceUpdate();
    this.props.onPropertiesUpdated();
  };

  _moveProperty = (oldIndex: number, newIndex: number) => {
    const { eventsBasedBehavior } = this.props;
    const properties = eventsBasedBehavior.getPropertyDescriptors();

    properties.move(oldIndex, newIndex);
    this.forceUpdate();
    this.props.onPropertiesUpdated();
  };

  render() {
    const { eventsBasedBehavior } = this.props;

    const properties = eventsBasedBehavior.getPropertyDescriptors();

    return (
      <I18n>
        {({ i18n }) => (
          <Column noMargin>
            <Line noMargin>
              <div style={styles.propertiesContainer}>
                {mapVector(
                  properties,
                  (property: gdNamedPropertyDescriptor, i: number) => (
                    <React.Fragment key={i}>
                      <MiniToolbar>
                        <Column expand noMargin>
                          <SemiControlledTextField
                            margin="none"
                            commitOnBlur
                            hintText={t`Enter the property name`}
                            value={property.getName()}
                            onChange={newName => {
                              if (newName === property.getName()) return;
                              if (
                                !validatePropertyName(i18n, properties, newName)
                              )
                                return;

                              this.props.onRenameProperty(
                                property.getName(),
                                newName
                              );

                              property.setName(newName);
                              this.forceUpdate();
                              this.props.onPropertiesUpdated();
                            }}
                            fullWidth
                          />
                        </Column>
                        <InlineCheckbox
                          label={
                            property.isHidden() ? (
                              <Trans>Hidden</Trans>
                            ) : (
                              <Trans>Visible in editor</Trans>
                            )
                          }
                          checked={!property.isHidden()}
                          onCheck={(e, checked) => {
                            property.setHidden(!checked);
                            this.forceUpdate();
                            this.props.onPropertiesUpdated();
                          }}
                          checkedIcon={<Visibility />}
                          uncheckedIcon={<VisibilityOff />}
                        />
                        <ElementWithMenu
                          element={
                            <IconButton>
                              <MoreVert />
                            </IconButton>
                          }
                          buildMenuTemplate={() => [
                            {
                              label: i18n._(t`Delete`),
                              click: () =>
                                this._removeProperty(property.getName()),
                            },
                            { type: 'separator' },
                            {
                              label: i18n._(t`Move up`),
                              click: () => this._moveProperty(i, i - 1),
                              enabled: i - 1 >= 0,
                            },
                            {
                              label: i18n._(t`Move down`),
                              click: () => this._moveProperty(i, i + 1),
                              enabled: i + 1 < properties.getCount(),
                            },
                          ]}
                        />
                      </MiniToolbar>
                      <Line expand noMargin>
                        <Column expand>
                          <SelectField
                            floatingLabelText={<Trans>Type</Trans>}
                            value={property.getType()}
                            onChange={(e, i, value: string) => {
                              property.setType(value);
                              this.forceUpdate();
                              this.props.onPropertiesUpdated();
                            }}
                            fullWidth
                          >
                            <SelectOption
                              value="Number"
                              primaryText={t`Number`}
                            />
                            <SelectOption
                              value="String"
                              primaryText={t`String`}
                            />
                            <SelectOption
                              value="Boolean"
                              primaryText={t`Boolean (checkbox)`}
                            />
                          </SelectField>
                        </Column>
                        <Column expand>
                          {(property.getType() === 'String' ||
                            property.getType() === 'Number') && (
                            <SemiControlledTextField
                              commitOnBlur
                              floatingLabelText={<Trans>Default value</Trans>}
                              hintText={
                                property.getType() === 'Number' ? '123' : 'ABC'
                              }
                              value={property.getValue()}
                              onChange={newValue => {
                                property.setValue(newValue);
                                this.forceUpdate();
                                this.props.onPropertiesUpdated();
                              }}
                              fullWidth
                            />
                          )}
                          {property.getType() === 'Boolean' && (
                            <SelectField
                              floatingLabelText={<Trans>Default value</Trans>}
                              value={
                                property.getValue() === 'true'
                                  ? 'true'
                                  : 'false'
                              }
                              onChange={(e, i, value) => {
                                property.setValue(value);
                                this.forceUpdate();
                                this.props.onPropertiesUpdated();
                              }}
                              fullWidth
                            >
                              <SelectOption
                                value="true"
                                primaryText={t`True (checked)`}
                              />
                              <SelectOption
                                value="false"
                                primaryText={t`False (not checked)`}
                              />
                            </SelectField>
                          )}
                        </Column>
                      </Line>
                      <Line expand noMargin>
                        <Column expand>
                          <SemiControlledTextField
                            commitOnBlur
                            floatingLabelText={
                              <Trans>Label, shown in the editor</Trans>
                            }
                            hintText={t`This should make the purpose of the property easy to understand`}
                            floatingLabelFixed
                            value={property.getLabel()}
                            onChange={text => {
                              property.setLabel(text);
                              this.forceUpdate();
                            }}
                            fullWidth
                          />
                        </Column>
                      </Line>
                    </React.Fragment>
                  )
                )}
                {properties.getCount() === 0 ? (
                  <EmptyMessage>
                    <Trans>
                      No properties for this behavior. Add one to store data
                      inside this behavior (for example: health, ammo, speed,
                      etc...)
                    </Trans>
                  </EmptyMessage>
                ) : null}
                <Column>
                  <Line justifyContent="flex-end" expand>
                    <RaisedButton
                      primary
                      label={<Trans>Add a property</Trans>}
                      onClick={this._addProperty}
                      labelPosition="before"
                      icon={<Add />}
                    />
                  </Line>
                </Column>
              </div>
            </Line>
          </Column>
        )}
      </I18n>
    );
  }
}
