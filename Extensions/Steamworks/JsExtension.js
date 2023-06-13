// @flow
/**
 * This is a declaration of an extension for GDevelop 5.
 *
 * ℹ️ Changes in this file are watched and automatically imported if the editor
 * is running. You can also manually run `node import-GDJS-Runtime.js` (in newIDE/app/scripts).
 *
 * The file must be named "JsExtension.js", otherwise GDevelop won't load it.
 * ⚠️ If you make a change and the extension is not loaded, open the developer console
 * and search for any errors.
 *
 * More information on https://github.com/4ian/GDevelop/blob/master/newIDE/README-extensions.md
 */

/*::
// Import types to allow Flow to do static type checking on this file.
// Extensions declaration are typed using Flow (like the editor), but the files
// for the game engine are checked with TypeScript annotations.
import { type ObjectsRenderingService, type ObjectsEditorService } from '../JsExtensionTypes.flow.js'
*/

module.exports = {
  createExtension: function (
    _ /*: (string) => string */,
    gd /*: libGDevelop */
  ) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        'Steamworks',
        _('Steamworks (Steam)'),
        _("Adds integrations for Steam's Steamworks game development SDK."),
        'Arthur Pacaud (arthuro555)',
        'MIT'
      )
      .setCategory('Third-party');

    extension
      .addInstructionOrExpressionGroupMetadata(_('Steamworks (Steam)'))
      .setIcon('JsPlatform/Extensions/steam.svg');

    extension
      .registerProperty('AppID')
      .setLabel(_('Steam App ID'))
      .setDescription(
        'Your Steam app ID, obtained from the Steamworks partner website.'
      )
      .setType('number')
      .setValue(480);

    extension
      .registerProperty('RequireSteam')
      .setDescription(_('Require Steam to launch the game'))
      .setType('boolean')
      .setValue(false);

    extension
      .addDependency()
      .setName('Steamworks')
      .setDependencyType('npm')
      .setExportName('steamworks.js')
      // Note: Updating steamworks.js here only updates it for the game builds,
      // also update newIDE/electron-app/app/package.json to update it for previews as well!
      .setVersion('0.2.0');

    extension
      .addAction(
        'ClaimAchievement',
        _('Claim achievement'),
        _(
          "Marks a Steam achievement as obtained. Steam will pop-up a notification wit the achievement's data defined on the Steamworks partner website."
        ),
        _('Claim steam achievement _PARAM0_'),
        _('Achievements'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'identifier',
        _('Achievement ID'),
        'SteamAchievement',
        false
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.claimAchievement');

    extension
      .addAction(
        'UnclaimAchievement',
        _('Unclaim achievement'),
        _("Removes a player's Steam achievement."),
        _('Unclaim Steam achievement _PARAM0_'),
        _('Achievements'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'identifier',
        _('Achievement ID'),
        'SteamAchievement',
        false
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.unclaimAchievement');

    extension
      .addCondition(
        'HasAchievement',
        _('Has achievement'),
        _("Checks if a player owns one of this game's Steam achievement."),
        _('Player has previously claimed the Steam achievement _PARAM0_'),
        _('Achievements'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'identifier',
        _('Achievement ID'),
        'SteamAchievement',
        false
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.hasAchievement');

    extension
      .addStrExpression(
        'SteamID',
        _('Steam ID'),
        _(
          "The player's unique Steam ID number. Note that it is too big a number to load correctly as a float, and must be used as a string."
        ),
        _('Player'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getSteamId');

    extension
      .addStrExpression(
        'Name',
        _('Name'),
        _("The player's registered name on Steam."),
        _('Player'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getName');

    extension
      .addStrExpression(
        'CountryCode',
        _('Country code'),
        _("The player's country represented as its two-letter code."),
        _('Player'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCountry');

    extension
      .addExpression(
        'Level',
        _('Steam Level'),
        _("Obtains the player's Steam level"),
        _('Player'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getLevel');

    extension
      .addAction(
        'SetRichPresence',
        _('Change the Steam rich presence'),
        _(
          "Changes an attribute of Steam's rich presence. Allows other player to see exactly what the player's currently doing in the game."
        ),
        _('Set steam rich presence attribute _PARAM0_ to _PARAM1_'),
        _('Rich presence'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'stringWithSelector',
        'The attribute to change',
        JSON.stringify([
          'status',
          'connect',
          'steam_display',
          'steam_player_group',
          'steam_player_group_size',
        ]),
        /*parameterIsOptional=*/ false
      )
      .setParameterLongDescription(
        '[Click here](https://partner.steamgames.com/doc/api/ISteamFriends#SetRichPresence) to find out more about the different default rich-presence attributes.'
      )
      .addParameter(
        'string',
        'The new value for that attribute',
        '',
        /*parameterIsOptional=*/ false
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.setRichPresence');

    extension
      .addCondition(
        'IsSteamworksLoaded',
        _('Is Steamworks Loaded'),
        _(
          'Checks whether the Steamworks SDK could be properly loaded. If steam is not installed, the game is not running on PC, or for any other reason Steamworks features will not be able to function, this function will trigger allowing you to disable functionality that relies on Steamworks.'
        ),
        _('Steamworks is properly loaded'),
        _('Utilities'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.isSteamworksProperlyLoaded');

    extension
      .addExpression(
        'AppID',
        _('Steam AppID'),
        _(
          "Obtains the game's Steam app ID, as declared in the games properties."
        ),
        _('Utilities'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getAppID');

    extension
      .addExpression(
        'ServerTime',
        _('Current time (from the Steam servers)'),
        _(
          'Obtains the real current time from the Steam servers, which cannot be faked by changing the system time.'
        ),
        _('Utilities'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getServerRealTime');

    extension
      .addCondition(
        'IsOnSteamDeck',
        _('Is on Steam Deck'),
        _(
          'Checks whether the game is currently running on a Steam Deck or not.'
        ),
        _('Game is running on a Steam Deck'),
        _('Utilities'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.isOnSteamDeck');

    extension
      .addAction(
        'CreateLobby',
        _('Create a lobby'),
        _(
          'Creates a new steam lobby owned by the player, for other players to join.'
        ),
        _(
          'Create a lobby visible to _PARAM0_ with max. _PARAM1_ players (store results in _PARAM2_)'
        ),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'stringWithSelector',
        'Visibility',
        JSON.stringify(['Private', 'FriendsOnly', 'Public', 'Invisible']),
        false
      )
      .setParameterLongDescription(
        `[Click here](https://partner.steamgames.com/doc/api/ISteamMatchmaking#ELobbyType) to learn more about the different lobby visibilities.`
      )
      .addParameter('expression', 'Maximal player count', '', false)
      .addParameter('scenevar', 'Store results in', '', true)
      .setParameterLongDescription(
        `The variable will be set to the ID of the lobby if successful, otherwise to "failure".`
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setAsyncFunctionName('gdjs.steamworks.createLobby');

    extension
      .addAction(
        'GetLobbies',
        _('Get a list of lobbies'),
        _(
          'Fills an array variable with a list of lobbies for the player to join.'
        ),
        _('Fill _PARAM0_ with a list of lobbies'),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('scenevar', 'Array to fill with lobbies', '', false)
      .setParameterLongDescription(
        `The variable will be set to an array of the IDs of the lobbies if they could be successfully obtained. If they could not be obtained, it is set to the string "failure".`
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setAsyncFunctionName('gdjs.steamworks.getLobbiesList');

    extension
      .addAction(
        'JoinLobby',
        _('Join a lobby (by ID)'),
        _('Join a Steam lobby, using its lobby ID.'),
        _('Join lobby _PARAM0_ (store result in _PARAM1_)'),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('string', 'Lobby ID', '', false)
      .addParameter('scenevar', 'Store results in', '', true)
      .setParameterLongDescription(
        `The variable will be set to the ID of the lobby if successful, otherwise to "failure".`
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setAsyncFunctionName('gdjs.steamworks.joinLobby');

    extension
      .addAction(
        'LeaveLobby',
        _('Leave current lobby'),
        _('Marks the player as having left the current lobby.'),
        _('Leave the current lobby'),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.leaveCurrentLobby');

    extension
      .addAction(
        'OpenInviteDialogue',
        _('Open invite dialogue'),
        _(
          'Opens the steam invitation dialogue to let the player invite their Steam friends to the current lobby. Only works if the player is currently in a lobby.'
        ),
        _('Open lobby invitation dialogue'),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName(
        'gdjs.steamworks.openDialogForInvitingUsersToTheCurrentLobby'
      );

    extension
      .addAction(
        'SetCurrentLobbyAttribute',
        _('Set a lobby attribute'),
        _(
          'Sets an attribute of the current lobby. Attributes are readable to anyone that can see the lobby. They can contain public information about the lobby like a description, or for example a P2P ID for knowing where to connect to join this lobby.'
        ),
        _(
          'Set current lobby attribute _PARAM0_ to _PARAM1_ (store result in _PARAM2_)'
        ),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'identifier',
        'The attribute to set',
        'SteamLobbyAttribute',
        false
      )
      .addParameter('string', 'Value to set the attribute to', '', false)
      .addParameter('scenevar', 'Variable where to store the result', '', true)
      .setParameterLongDescription(
        'The variable will be set to true if the attribute was successfully set and to false if it could not be set.'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.setCurrentLobbyAttribute');

    extension
      .addAction(
        'SetCurrentLobbyJoinability',
        _('Set the lobby joinability'),
        _('Sets whether other users can join the current lobby or not.'),
        _('Make current lobby joinable: _PARAM0_ (store result in _PARAM1_)'),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('yesorno', 'Should the lobby be joinable?', '', false)
      .addParameter('scenevar', 'Variable where to store the result', '', true)
      .setParameterLongDescription(
        'The variable will be set to true if the joinability was successfully set and to false if it could not be changed.'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.setCurrentLobbyJoinability');

    extension
      .addAction(
        'GetCurrentLobbyMembers',
        _("Get the lobby's members"),
        _('Gets the Steam ID of all players in the current lobby.'),
        _('Store the array of all players in _PARAM0_'),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter(
        'scenevar',
        'Variable where to store the player list',
        '',
        false
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCurrentLobbyMembersList');

    extension
      .addAction(
        'GetLobbyMembers',
        _("Get a lobby's members"),
        _('Gets the Steam ID of all players in a lobby.'),
        _('Store the array of all players of lobby _PARAM0_ in _PARAM1_'),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg',
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('string', 'The lobby ID', '', false)
      .addParameter(
        'scenevar',
        'Variable where to store the player list',
        '',
        false
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getLobbyMembersList');

    extension
      .addStrExpression(
        'CurrentLobbyID',
        _("Current lobby's ID"),
        _(
          'The ID of the current lobby, useful for letting other players join it.'
        ),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCurrentLobbyId');

    extension
      .addStrExpression(
        'CurrentLobbyAttribute',
        _('Attribute of the lobby'),
        _("Obtains the value of one of the current lobby's attributes."),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCurrentLobbyAttribute');

    extension
      .addExpression(
        'CurrentLobbyMemberCount',
        _('Member count of the lobby'),
        _("Obtains the current lobby's member count."),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCurrentLobbyMemberCount');

    extension
      .addExpression(
        'CurrentLobbyMemberLimit',
        _('Member limit of the lobby'),
        _("Obtains the current lobby's maximum member limit."),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCurrentLobbyMemberLimit');

    extension
      .addStrExpression(
        'CurrentLobbyOwner',
        _('Owner of the lobby'),
        _('Obtains the Steam ID of the user that owns the current lobby.'),
        _('Matchmaking/Current lobby'),
        'JsPlatform/Extensions/steam.svg'
      )
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getCurrentLobbyOwner');

    extension
      .addStrExpression(
        'LobbyAttribute',
        _('Attribute of a lobby'),
        _("Obtains the value of one of a lobby's attributes."),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('string', 'The ID of the lobby', '', false)
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getLobbyAttribute');

    extension
      .addExpression(
        'LobbyMemberCount',
        _('Member count of a lobby'),
        _("Obtains a lobby's member count."),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('string', 'The ID of the lobby', '', false)
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getLobbyMemberCount');

    extension
      .addExpression(
        'LobbyMemberLimit',
        _('Member limit of a lobby'),
        _("Obtains a lobby's maximum member limit."),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('string', 'The ID of the lobby', '', false)
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getLobbyMemberLimit');

    extension
      .addStrExpression(
        'LobbyOwner',
        _('Owner of a lobby'),
        _('Obtains the Steam ID of the user that owns a lobby.'),
        _('Matchmaking'),
        'JsPlatform/Extensions/steam.svg'
      )
      .addParameter('string', 'The ID of the lobby', '', false)
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/Steamworks/steamworkstools.js')
      .setFunctionName('gdjs.steamworks.getLobbyOwner');

    return extension;
  },
  runExtensionSanityTests: function (
    gd /*: libGDevelop */,
    extension /*: gdPlatformExtension*/
  ) {
    return [];
  },
};
