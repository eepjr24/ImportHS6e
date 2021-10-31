# ImportHS6e
Character sheet import tool for Roll20. Imports Hero System 6e sheets to the Hero6e character sheet.

This sheet is recommended to be used with the other non-official Hero System API's (HeroSystem6e and HeroTracker).

You can install the API's for HeroSystem6e and HeroTracker applications via the one click install. My importer will be there once I have it working and ready for production. Here is a link that covers the one click installs: 

https://help.roll20.net/hc/en-us/articles/360046238454-How-to-Install-API-Scripts-via-1-Click-Install#where-to-go-to-install-0-0

To install the character importer you need to use these instructions:
https://help.roll20.net/hc/en-us/articles/360037256714-API#D&D5eOGLRollTemplates-StyleDifferences

Scroll down to How do I install an API script if I want to write my own code or I want to use code from an external source and follow the directions.

To import a character:
1. Export the character using the attached JSON template.
2. Open the JSON character sheet and copy the contents.
3. Open the character sheet (as the GM), click Edit at the top right of the sheet and paste the JSON into the GM Notes field.
4. Click Save Changes.
5. Assign the character sheet to a token on the board and select the token (you will get an error message in chat on the next step if you don't).
6. Switch to the Chat window and paste in !ImportHS6e --debug (or you can shorten it to !i6e --debug)
7. Open the character sheet (if you closed it) 
8. Click Edit on the character sheet then Save Changes.

Notes on design in Hero Designer:
1. Avoid use of double quotes and other special characters, sometimes these will cause JSON parsing errors.
2. When designing compound powers, each power will be a separate line on the character sheet. Make sure to name each power if you want them to be named on the character sheet. 
3. When naming powers keep in mind that at max display width you will only see ~25 characters and at normal display width around 18.
4. You will need a version of Hero Designer that is later that January 2018 for this import to work. I don't have the exact date, but if you narrow it down let me know and I will add notes here.

