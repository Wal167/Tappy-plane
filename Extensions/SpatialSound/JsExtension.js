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
    extension.setExtensionInformation(
      'SpatialSound',
      _('Spatial sound'),
      _(
        'Allow positioning sounds in 3D space, using a stereo system to make the player know where a sound came from.'
      ),
      'Arthur Pacaud (arthuro555)',
      'MIT'
    );

    extension
      .addAction(
        'SetSoundPosition',
        _('Set position of sound'),
        _('Sets the spatial position of a sound.'),
        _(
          'Set position of sound on channel _PARAM1_ to position _PARAM2_, _PARAM3_, _PARAM4_'
        ),
        _('Audio/Spatial Sound'),
        'res/actions/son24.png',
        'res/actions/son.png'
      )
      .addCodeOnlyParameter('currentScene', '')
      .addParameter('expression', _('Channel'), '', false)
      .addParameter('expression', _('X position'), '', false)
      .addParameter('expression', _('Y position'), '', false)
      .addParameter('expression', _('Z position'), '', false)
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/SpatialSound/howler.spatial.min.js')
      .addIncludeFile('Extensions/SpatialSound/spatialsoundtools.js')
      .setFunctionName('gdjs.evtTools.spatialSound.setSoundPosition');

    extension
      .addAction(
        'SetListenerPosition',
        _('Set position of the listener'),
        _('Sets the spatial position of the listener/player.'),
        _('Set the listener position to _PARAM0_, _PARAM1_, _PARAM2_'),
        _('Audio/Spatial Sound'),
        'res/actions/son24.png',
        'res/actions/son.png'
      )
      .addParameter('expression', _('X position'), '', false)
      .addParameter('expression', _('Y position'), '', false)
      .addParameter('expression', _('Z position'), '', false)
      .getCodeExtraInformation()
      .setIncludeFile('Extensions/SpatialSound/howler.spatial.min.js')
      .addIncludeFile('Extensions/SpatialSound/spatialsoundtools.js')
      .setFunctionName('Howler.pos');

    return extension;
  },
  runExtensionSanityTests: function (
    gd /*: libGDevelop */,
    extension /*: gdPlatformExtension*/
  ) {
    return [];
  },
};
