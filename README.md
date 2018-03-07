# Taskerbot

Telegram Bot for task tracking used at #RGB. Each member of the group can submit the task they have done. The task defined by project's name and short description about the task.

This repository consists of 3 parts of tasker:

* Bot code (`bot.js`)

   Defines commands for telegram bot using telegram bot api and mongodb. 

* API code (`web.js`)

   Provides API for client to shows log recap
   
* Client web interface

   Implements tasker API on a web, showing table of log recap

***

## Terms

* Project
   
   The largest unit of the task. It consists of name and short code. Short code is used to refer to the project when member submit their task. 

* Log
   
   Every task a member submitted is saved as a log. It consists of date, slot, project id, and content (short description).  

* Slot
   
   Representation of time windows in a day. 1 slot in #RGB's system is equal to 2 hours, starts from 8.00 AM.  

* Member
   
   Member of the group who is responsible to submit the task to task tracker.  


## Bot Scenarios


* Add Project

   * Usage in the group:

      - Can only be used by admin.
      - Admin inputs command `/add_project` in the group.
      - Bot will send private message to admin.
      - Admin inputs project with following format `[project code]-[project name]`
      - Admin inputs command `/add_project` to add another project, or `/done` to end the command.

   * Usage in private message:

      - Can only be used by admin of the group.
      - Admin sends command `/add_project` to the bot.
      - Admin inputs project with following format `[project code]-[project name]`
      - Admin inputs command `/add_project` to add another project, or `/done` to end the command.


* List Project

   - Can only be used by members of the group.
   - Member inputs command `/list_project` on the group or to the bot.
   - Bot will send list of projects.


* Remove Project

   * Usage in the group:

      - Can only be used by admin.
      - Admin inputs command `/remove_project` in the group.
      - Bot will send private message to admin, asking which project will be deleted.
      - Admin inputs project code with the help of formatted keyboard button.

   * Usage in private message:

      - Can only be used by admin.
      - Admin sends command `/remove_project` to the group.
      - Bot will reply, asking which project will be deleted.
      - Admin inputs project code with the help of formatted keyboard button.


* Log Reminder

   * Usage in the group:

      - Can only be used by admin.
      - Admin inputs command `/log_reminder<space>[slot]` in the group.
      - Each member who hasn't submitted log for that slot will get a private message from bot, asking them to log.
      - Continue to Add Log scenario
      
   * Usage in private message:

      - Can only be used by admin.
      - Admin inputs command `/log_reminder<space>[slot]` in the group.
      - Each member who hasn't submitted log for that slot will get a private message from bot, asking them to log.
      - Continue to Add Log scenario


* Add Log

   * Usage in the group:

      - Can only be used by members of the group.
      - Member inputs command `/log<space>[slot]<space>[date (optional)]<space>[month (optional)]<space>[year (optional)]` in the group.
      - Bot will send a private message, asking which project they have done.
      - Member inputs project code with the help of formatted keyboard button.
      - Bot will reply, asking for short description about the task
      - Member inputs short description about the task they have done.

   * Usage in private message:

      - Can only be used by members of the group.
      - Member sends command `/log<space>[slot]<space>[date (optional)]<space>[month (optional)]<space>[year (optional)]` to the bot.
      - Member inputs project code with the help of formatted keyboard button.
      - Bot will reply, asking for short description about the task
      - Member inputs short description about the task they have done.


* Edit Log

   * Usage in the group:

      - Can only be used by members of the group.
      - Member inputs command `/log<space>[slot]<space>[date (optional)]<space>[month (optional)]<space>[year (optional)]` in the group.
      - If the member has inputted log for selected slot before, bot will send a private message, asking the member to edit or delete the existing log. 
      - Member chooses edit.
      - Continue to `Add Log` scenario.


   * Usage in private message:

      - Can only be used by members of the group.
      - Member sends command `/log<space>[slot]<space>[date (optional)]<space>[month (optional)]<space>[year (optional)]` to the bot.
      - If the member has inputted log for selected slot before, bot will ask the member to edit or delete the existing log. 
      - Member chooses edit.
      - Continue to `Add Log` scenario.


* Delete Log

   * Usage in the group:

      - Can only be used by members of the group.
      - Member inputs command `/log<space>[slot]<space>[date (optional)]<space>[month (optional)]<space>[year (optional)]` in the group.
      - If the member has inputted log for selected slot before, bot will send private message, asking the member to edit or delete the existing log. 
      - Member chooses delete.
      - Log for the selected slot will be deleted.


   * Usage in private message:

      - Can only be used by members of the group.
      - Member sends command `/log<space>[slot]<space>[date (optional)]<space>[month (optional)]<space>[year (optional)]` to the bot.
      - If the member has inputted log for selected slot before, bot will ask the member to edit or delete the existing log. 
      - Member chooses edit.
      - Log for the selected slot will be deleted.


* Log Recap

	* Usage in the group:

      - Can only be used by admin.
      - Admin inputs command `/log_recap<space>[date]<space>[month (optional)]<space>[year (optional)]` in the group.
      - Bot will send log recap for selected date to admin.


   * Usage in private message:

      - Can only be used by admin.
      - Admin inputs command `/log_recap<space>[date]<space>[month (optional)]<space>[year (optional)]` to the bot.
      - Bot will reply with log recap for selected date.



## How to run it locally

* Telegram Bot

   * To run bot locally, you would need:
      - Credential on mongoose
      - Telegram bot token
      - Telegram bot id
      - Telegram group id

   * Set the following environment variables:
      - TASKERBOT_BOT_ID
      - TASKERBOT_BOT_TOKEN
      - TASKERBOT_GROUP_ID
      - TASKERBOT_MONGO_CRED

   * Run `npm install` in command prompt

   * Run `node bot.js` in command prompt

* Tasker API

   * To run API locally, you would need:
      - Credential on mongoose
      
   * Set the following environment variables:
      - TASKERBOT_MONGO_CRED

   * Run `npm install` in command prompt

   * Run `node web.js` in command prompt

* Client web

   To run client web you should run tasker API first. Change `url` in `script.js` and open `index.html` on your browser.

***

## TODO

* Move copytext string to separate file, replace with variables
* Turn off reminder on holidays
* Log via web
