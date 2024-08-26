// @flow

import * as React from 'react';
import { Trans } from '@lingui/macro';
import Grid from '@material-ui/core/Grid';
import GridList from '@material-ui/core/GridList';
import Divider from '@material-ui/core/Divider';
import TeamContext from '../../../../../Profile/Team/TeamContext';
import Dialog, { DialogPrimaryButton } from '../../../../../UI/Dialog';
import Text from '../../../../../UI/Text';
import AuthenticatedUserContext from '../../../../../Profile/AuthenticatedUserContext';
import UserLine from '../../../../../UI/User/UserLine';
import FlatButton from '../../../../../UI/FlatButton';
import LeftLoader from '../../../../../UI/LeftLoader';
import Form from '../../../../../UI/Form';
import { ColumnStackLayout, LineStackLayout } from '../../../../../UI/Layout';
import TextField from '../../../../../UI/TextField';
import { emailRegex } from '../../../../../Utils/EmailUtils';
import RaisedButton from '../../../../../UI/RaisedButton';
import Add from '../../../../../UI/CustomSvgIcons/Add';
import { groupMembersByGroupId, sortGroupsWithMembers } from '../Utils';
import { Column, Line } from '../../../../../UI/Grid';
import ManageStudentRow from './ManageStudentRow';
import { changeTeamMemberPassword } from '../../../../../Utils/GDevelopServices/User';
import AlertMessage from '../../../../../UI/AlertMessage';
import Link from '../../../../../UI/Link';
import TeamAvailableSeats from '../TeamAvailableSeats';
import { copyTextToClipboard } from '../../../../../Utils/Clipboard';

type AddTeacherError =
  | 'no-seats-available'
  | 'user-already-added'
  | 'user-owner'
  | 'not-allowed'
  | 'unexpected';

const getEmailErrorText = (error: ?AddTeacherError) => {};

type AddTeacherDialogProps = {|
  onClose: () => void,
|};

const AddTeacherDialog = ({ onClose }: AddTeacherDialogProps) => {
  const [email, setEmail] = React.useState<string>('');
  const [actionInProgress, setActionInProgress] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState<boolean>(true);
  const [addError, setAddError] = React.useState<?AddTeacherError>(null);

  const doAddTeacher = React.useCallback(() => {
    // TODO once endpoint is available
  }, []);

  return (
    <Dialog
      title="Add a collaborator"
      actions={[
        <FlatButton
          label={<Trans>Back</Trans>}
          disabled={actionInProgress}
          key="back"
          primary={false}
          onClick={onClose}
        />,
        <LeftLoader isLoading={actionInProgress} key="add-collaborator">
          <DialogPrimaryButton
            label={<Trans>Add</Trans>}
            primary
            onClick={doAddTeacher}
            disabled={actionInProgress}
          />
        </LeftLoader>,
      ]}
      maxWidth="xs"
      cannotBeDismissed={actionInProgress}
      onRequestClose={onClose}
      onApply={doAddTeacher}
      open
    >
      <Form onSubmit={doAddTeacher} name="addCollaborator">
        <ColumnStackLayout noMargin>
          <TextField
            autoFocus="desktop"
            value={email}
            floatingLabelText={<Trans>Email</Trans>}
            type="email"
            onChange={(e, value) => {
              if (!isEmailValid) setIsEmailValid(true);
              if (addError) setAddError(null);
              setEmail(value);
            }}
            errorText={
              !isEmailValid ? (
                <Trans>Invalid email address.</Trans>
              ) : (
                getEmailErrorText(addError)
              )
            }
            fullWidth
            onBlur={event => {
              const trimmedEmail = event.currentTarget.value.trim();
              setEmail(trimmedEmail);
              if (trimmedEmail) {
                setIsEmailValid(emailRegex.test(trimmedEmail));
              }
            }}
            disabled={actionInProgress}
          />
        </ColumnStackLayout>
      </Form>
    </Dialog>
  );
};

type Props = {|
  onClose: () => void,
|};

const ManageEducationAccountDialog = ({ onClose }: Props) => {
  const { profile, getAuthorizationHeader } = React.useContext(
    AuthenticatedUserContext
  );
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [
    addTeacherDialogOpen,
    setAddTeacherDialogOpen,
  ] = React.useState<boolean>(false);
  const {
    groups,
    team,
    admins,
    members,
    memberships,
    onRefreshMembers,
  } = React.useContext(TeamContext);

  const onChangeMemberPassword = React.useCallback(
    async ({
      userId,
      newPassword,
    }: {|
      userId: string,
      newPassword: string,
    |}) => {
      if (!profile) return;
      await changeTeamMemberPassword(getAuthorizationHeader, {
        adminUserId: profile.id,
        userId,
        newPassword,
      });
      await onRefreshMembers();
    },
    [getAuthorizationHeader, profile, onRefreshMembers]
  );

  const onCopyActiveCredentials = React.useCallback(
    () => {
      if (!members) return;
      let content = 'Username,Email,Password';
      let membersToConsider = [];
      if (selectedUserIds.length === 0) {
        membersToConsider = members;
      } else {
        membersToConsider = members.filter(member =>
          selectedUserIds.includes(member.id)
        );
      }
      membersToConsider.forEach(member => {
        content += `\n${member.username || ''},${
          member.email
        },${member.password || ''}`;
      });
      copyTextToClipboard(content);
    },
    [selectedUserIds, members]
  );

  const membersByGroupId = groupMembersByGroupId({
    groups,
    members,
    memberships,
  });

  if (
    !admins ||
    !members ||
    !team ||
    !groups ||
    !memberships ||
    !membersByGroupId
  ) {
    return null;
  }
  const groupsWithMembers = [
    membersByGroupId['NONE']
      ? { group: null, members: membersByGroupId['NONE'].members }
      : null,
    ...sortGroupsWithMembers(membersByGroupId),
  ].filter(Boolean);

  const availableSeats =
    team && members && admins ? team.seats - members.length - admins.length : 0;

  return (
    <>
      <Dialog
        title={<Trans>Manage seats</Trans>}
        flexColumnBody
        fullHeight
        open
        onRequestClose={onClose}
      >
        <ColumnStackLayout noMargin>
          {availableSeats === 0 && (
            <AlertMessage kind="info">
              <Trans>
                You’ve reached the maximum amount of available seats.{' '}
                <Link href="mailto:education@gdevelop.io">
                  Increase the number of seats
                </Link>{' '}
                on your subscription to invite more students and collaborators.
              </Trans>
            </AlertMessage>
          )}
          <Text size="sub-title" noMargin>
            <Trans>Teacher accounts</Trans>
          </Text>
          <Column noMargin>
            {admins &&
              admins.map(adminUser => (
                <UserLine
                  key={adminUser.id}
                  username={adminUser.username}
                  email={adminUser.email}
                  level={null}
                  onDelete={null}
                  disabled={profile && adminUser.id === profile.id}
                />
              ))}
          </Column>
          <Line noMargin>
            <RaisedButton
              primary
              icon={<Add fontSize="small" />}
              label={<Trans>Add teacher</Trans>}
              onClick={() => setAddTeacherDialogOpen(true)}
            />
          </Line>
          <Divider />
          <LineStackLayout
            noMargin
            justifyContent="space-between"
            alignItems="center"
          >
            <Text size="sub-title" noMargin>
              <Trans>Student accounts</Trans>
            </Text>
            <LineStackLayout noMargin alignItems="center">
              <TeamAvailableSeats
                team={team}
                members={members}
                admins={admins}
              />
              <RaisedButton
                primary
                label={<Trans>Copy active credentials</Trans>}
                onClick={onCopyActiveCredentials}
              />
            </LineStackLayout>
          </LineStackLayout>
          <Column>
            <GridList cols={2} cellHeight={'auto'}>
              <Grid item xs={5}>
                <Text style={{ opacity: 0.7 }}>
                  <Trans>Student</Trans>
                </Text>
              </Grid>
              <Grid item xs={7}>
                <Text style={{ opacity: 0.7 }}>
                  <Trans>Password</Trans>
                </Text>
              </Grid>
            </GridList>
            {groupsWithMembers.length > 0
              ? groupsWithMembers.map(({ group, members }) => {
                  return (
                    <React.Fragment key={group ? group.id : 'lobby'}>
                      <Line noMargin>
                        <Text size="sub-title">
                          {group ? group.name : <Trans>Lobby</Trans>}
                        </Text>
                      </Line>
                      <Column>
                        <GridList cols={2} cellHeight={'auto'}>
                          {members.map(member => {
                            return (
                              <ManageStudentRow
                                member={member}
                                key={member.id}
                                onChangePassword={onChangeMemberPassword}
                                isSelected={selectedUserIds.includes(member.id)}
                                onSelect={selected => {
                                  const memberIndexInArray = selectedUserIds.indexOf(
                                    member.id
                                  );
                                  if (selected) {
                                    if (memberIndexInArray === -1) {
                                      setSelectedUserIds([
                                        ...selectedUserIds,
                                        member.id,
                                      ]);
                                    }
                                    return;
                                  } else {
                                    const newArray = [...selectedUserIds];
                                    if (memberIndexInArray >= 0) {
                                      newArray.splice(memberIndexInArray, 1);
                                      setSelectedUserIds(newArray);
                                    }
                                  }
                                }}
                              />
                            );
                          })}
                        </GridList>
                      </Column>
                    </React.Fragment>
                  );
                })
              : 'Hello'}
          </Column>
        </ColumnStackLayout>
      </Dialog>
      {addTeacherDialogOpen && (
        <AddTeacherDialog onClose={() => setAddTeacherDialogOpen(false)} />
      )}
    </>
  );
};

export default ManageEducationAccountDialog;
