/**
 * This is a declaration of an extension for GDevelop 5.
 *
 * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change
 * to this extension file or to any other *.js file that you reference inside.
 *
 * The file must be named "JsExtension.js", otherwise GDevelop won't load it.
 * ⚠️ If you make a change and the extension is not loaded, open the developer console
 * and search for any errors.
 *
 * More information on https://github.com/4ian/GDevelop/blob/master/newIDE/README-extensions.md
 */
module.exports = {
    createExtension: function(_, gd) {
        const extension = new gd.PlatformExtension();

        extension
          .setExtensionInformation(
            'Firebase',
            _('Firebase'),
            _('Use google Firebase features in GDevelop'),
            'Arthur Pacaud (arthuro555)',
            'MIT'
          )
          .setExtensionHelpPath('/all-features/firebase');

		
		/* ====== ANALYTICS ====== */
        extension
          .addAction(
            'AnalyticsLog',
            _('Log an Event'),
            _(
              'Triggers an Event/Conversion for the current user on the Analytics.' + 
              'Can also pass additional data to the Analytics'
             ),
            _('Trigger Event _PARAM1_ with argument _PARAM2_'),
            _('Firebase/Analytics'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addCodeOnlyParameter('currentScene', '')
          .addParameter('string', _('Event Name'), '', false)
          .addParameter('string', _('Additional Data'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-analytics.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_analyticstools.js')
          .setFunctionName('gdjs.evtTools.firebase.analytics.log');

        extension
          .addAction(
            'AnalyticsSetUID',
            _('Change user UID'),
            _(
              'Changes the current user\'s analytics identifier. ' +
              'This is what let Analytics differienciate users, ' + 
              'so it should always be unique for each user. ' + 
              'Only mess with that if you know what you are doing!'
             ),
            _('Set current user\'s ID to _PARAM1_'),
            _('Firebase/Analytics'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addCodeOnlyParameter('currentScene', '')
          .addParameter('string', _('New Unique ID'), '', false)
          .markAsComplex()
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-analytics.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_analyticstools.js')
          .setFunctionName('gdjs.evtTools.firebase.analytics.setUserID');
        
        extension
          .addAction(
            'AnalyticsSetProperty',
            _('Set a user\'s property'),
            _(
              'Sets an user\'s properties.' + 
              'Can be used to classify users in Analytics.'
             ),
            _('Set property _PARAM1_ of the current user to _PARAM2_'),
            _('Firebase/Analytics'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addCodeOnlyParameter('currentScene', '')
          .addParameter('string', _('Property Name'), '', false)
          .addParameter('string', _('Property Data'), '', false)
          .markAsAdvanced()
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-analytics.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_analyticstools.js')
          .setFunctionName('gdjs.evtTools.firebase.analytics.setProperty');


		/* ====== REMOTE CONFIGURATION ====== */
        extension
          .addStrExpression(
            'GetRCString',
            _('Get Remote setting as String'),
            _('Get a setting from Firebase Remote Config as String.'),
            _('Firebase/Remote Config'),
            'JsPlatform/Extensions/filesystem_folder24.png',
            'JsPlatform/Extensions/filesystem_folder32.png'
          )
          .addParameter('string', _('Setting Name'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-remote-config.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_remoteconfigtools.js')
          .setFunctionName('firebase.remoteConfig().getString');

        extension
          .addExpression(
            'GetRCString',
            _('Get Remote setting as Number'),
            _('Get a setting from Firebase Remote Config as Number.'),
            _('Firebase/Remote Config'),
            'JsPlatform/Extensions/filesystem_folder24.png',
            'JsPlatform/Extensions/filesystem_folder32.png'
          )
          .addParameter('string', _('Setting Name'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-remote-config.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_remoteconfigtools.js')
          .setFunctionName('firebase.remoteConfig().getNumber');

        extension
          .addAction(
            'SetRCAutoUpdateInterval',
            _('Set Remote Config Auto Update Inteval'),
            _('Sets Remote Config Auto Update Inteval.'),
            _('Set Remote Config Auto Update Inteval to _PARAM0_'),
            _('Firebase/Remote Config'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addParameter('number', _('Update Interval in ms'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-remote-config.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_remoteconfigtools.js')
          .setFunctionName('gdjs.evtTools.firebase.RC.setAutoUpdateInterval');
        
        extension
          .addAction(
            'SetRCDefaultConfig',
            _('Set the default configuration'),
            _(
              'As the Remote Config is online, you need to set a default ' + 
              'for when there is no internet or the config still loading.'
            ),
            _('Set default config to _PARAM0_'),
            _('Firebase/Remote Config'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addParameter('scenevar', _('Structure with defaults'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-remote-config.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_remoteconfigtools.js')
          .setFunctionName('gdjs.evtTools.firebase.RC.setDefaultConfig');

        extension
          .addAction(
            'ForceReloadRC',
            _('Force sync the configuration'),
            _('Use this to sync the Remote Config with the client at any time.'),
            _('Synchronize Remote Config'),
            _('Firebase/Remote Config'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-remote-config.js')
          .setFunctionName('firebase.remoteConfig().fetchAndActivate');

		
		/* ====== AUTHENTIFICATION ====== */
        extension
          .addAction(
            'CreateBasicAccount',
            _('Create account with basic auth'),
            _('Create an account with e-mail and password as credentials.'),
            _('Create account with E-Mail _PARAM0_ and password _PARAM1_'),
            _('Firebase/Authentification'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addParameter('string', _('E-Mail'), '', false)
          .addParameter('string', _('Password'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-auth.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_authtools.js')
          .setFunctionName('firebase.auth().createUserWithEmailAndPassword');

        extension
          .addAction(
            'BasicAccountSignIn',
            _('Sign into an account with basic auth'),
			_(
			  'Sign into an account with e-mail and password as credentials. ' +
			  'The Authetification state variable will be set to "ok" if the authentification ' +
			  'is succcessful, else it will contain the error message.'
			),
            _('Connect to account with E-Mail _PARAM0_ and password _PARAM1_'),
            _('Firebase/Authentification'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .addParameter('string', _('E-Mail'), '', false)
		  .addParameter('string', _('Password'), '', false)
		  .addParameter('scenevar', _('Authentification State Variable'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-auth.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_authtools.js')
          .setFunctionName('gdjs.evtTools.firebase.auth.signInWithEmail');
		
		extension
          .addAction(
            'ProviderAccountSignIn',
            _('Sign into an account with auth from provider'),
			_(
			  'Sign into an account via an external provider. ' +
			  'The Authetification state variable will be set to "ok" if the authentification ' +
			  'is succcessful, else it will contain the error message. \n' +
			  'The availablke providers are: "google", "facebook", "github" and "twitter".\n' + 
			  'Provider Authentification only works in the browser.'
			),
            _('Connect to account with Provider _PARAM0_'),
            _('Firebase/Authentification'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
		  .addParameter('scenevar', _('Authentification State Variable'), '', false)
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-auth.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_authtools.js')
          .setFunctionName('gdjs.evtTools.firebase.auth.signInWithProvider');

        extension
          .addAction(
            'AnonymSignIn',
            _('Sign In as an anonym guest'),
            _('Sign into a temporary anonymous account.'),
            _('Authenticate anonymously'),
            _('Firebase/Authentification'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-auth.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_authtools.js')
          .setFunctionName('firebase.auth().signInAnonymously');

        extension
          .addCondition(
            'IsSignedIn',
            _('Is the user signed in?'),
			_(
			  'Checks if the user is signed in. \nYou should always use ' +
			  'this before actions requiring authentifications.'
			),
            _('Check for authentification'),
            _('Firebase/Authentification'),
            'JsPlatform/Extensions/filesystem_save_file24.png',
            'JsPlatform/Extensions/filesystem_save_file32.png'
          )
          .getCodeExtraInformation()
          .setIncludeFile('Extensions/Firebase/firebasejs/A_firebase-base.js')
          .addIncludeFile('Extensions/Firebase/firebasejs/B_firebase-auth.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/C_firebasetools.js')
          .addIncludeFile('Extensions/Firebase/firebasetools/D_authtools.js')
          .setFunctionName('gdjs.evtTools.firebase.auth.isAuthentified');

        return extension;
    },
    runExtensionSanityTests: function(gd, extension) {
        return [];
    },
}
