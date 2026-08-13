# Firebase Setup Required

Before building the release APK:

1. Go to Firebase Console → Project Settings
2. Add Android app with package name: 
   shop.thunderbold.app
3. Download google-services.json
4. Place it at: android/app/google-services.json

Without this file the build will fail.

Also note: In android/app/build.gradle,
verify these lines exist (Capacitor adds 
them automatically but confirm):

apply plugin: 'com.google.gms.google-services'

And in android/build.gradle, verify:
classpath 'com.google.gms:google-services:4.4.0'
