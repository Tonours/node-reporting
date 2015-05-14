# Node-reporting

Node-reporting is a simple tool for easily export your .ics calendar to json / html and send an html email to your favorite recipient.

Node-reporting est un simple outils qui vous permet d'exporter votre calendrier .ics en json et html, ainsi que d'envoyer un mail au format html au destinataire favoris.

## Version

This script is a draft and a "test-project" to play with node.js.
So yes it's not well commented.

## Install

1. Clone this repo
2. npm install
3. Export your calendar at the root folder and name it calendar.ics
3. node index.js
4. Follow asked indications on terminal

## Other stuff

### Screenshot

![Terminal example](https://photos-5.dropbox.com/t/2/AAAOZG-V9cJNgU0EJ9PlMf93VIOV0HTvYpcM7q05u5jFgw/12/61184514/jpeg/1024x768/3/1431576000/0/2/node-report.jpg/CIK0lh0gASACIAMgBCAFKAE/u_CG1u12ReFTcezMVyDZYAaZnUQWd6oGbinv4W0uYPc "Node-reporting in use")

### Node-mailer and Gmail

I've used node-mailer (gmail service auth) to send emails.
Gmail mail and password are asked only if you want sent the calendar reporting by email and at each script execution.

