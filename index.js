var fs            = require('fs'),
    icalendar     = require('icalendar'),
    moment        = require('moment'),
    _             = require('underscore'),
    async         = require('async'),
    mustache      = require('mustache'),
    nodemailer    = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    inquirer      = require('inquirer'),
    eventsItems   = [];
require('moment-duration-format');



/**
* Definition of questions
*
*/

var questions = function createConfig(){
  var firstQuestions = [
    {
      type: "confirm",
      name: "createConfig",
      message: "Hi ! Are you ready to generate your reporting ?",
      default: true
    },
    {
      type: "input",
      name: "username",
      message: "So What's your name ? "
    }
  ];

  var checkAgenda = [
    {
      type: "confirm",
      name: "agendaCheck",
      message: "Alright, do you have export your calendar to root folder of the project ? ",
      default: true
    }
  ];

  var checkPeriod = [
    {
      type: "list",
      name: "period",
      message: "What period do you want to export ?",
      choices: [
        {
          name: "This week",
          value: "thisWeek"
        },
        {
          name: "Last week",
          value: "lastWeek"
        },
        {
          name: "Two weeks ago",
          value: "twoWeeksAgo"
        }
      ]
    },
  ];

  var checkData = [
    {
      type: "confirm",
      name: "dataCheck",
      message: "Data are they good ?",
      default: false
    }
  ];

  var checkMail = [
    {
      type: "confirm",
      name: "mailCheck",
      message: "Do you want to send data by mail ?",
      default: false
    }
  ];

  var configMail = [
    {
      type: "input",
      name: "mail",
      message: "What's your mail address (gmail) ?",
      validate: function( value ) {
        var mail = value.match(/(\W|^)[\w.+\-]*@gmail\.com(\W|$)/i);
        if (mail) {
          return true;
        } else {
          return "Please enter a valid Gmail address";
        }
      }
    },
    {
      type: "password",
      name: "password",
      message: "What's your mail password ?"
    },
    {
      type: "input",
      name: "mailto",
      message: "What is the address of your recipient ?",
      validate: function( value ) {
        var mail = value.match(/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i);
        if (mail) {
          return true;
        } else {
          return "Please enter a valid mail address";
        }
      }
    },
  ];

  var answers;

  inquirer.prompt( firstQuestions, function( answers ) {
    inquirer.prompt(checkAgenda, function(answersAgenda){
      if(answersAgenda.agendaCheck){
        inquirer.prompt(checkPeriod, function(answersPeriod){
          switch(answersPeriod.period) {
            case 'thisWeek':
              var startDate = moment().startOf('isoWeek')._d;
              var endDate   = moment().endOf('isoWeek')._d;
              break;
            case 'lastWeek':
              var startDate = moment().subtract(7, 'days').startOf('isoWeek')._d;
              var endDate = moment().subtract(7, 'days').endOf('isoWeek')._d;
              break;
            case 'twoWeeksAgo':
              var startDate = moment().subtract(14, 'days').startOf('isoWeek')._d;
              var endDate = moment().subtract(14, 'days').endOf('isoWeek')._d;
              break;
            default:
              var startDate = moment().startOf('isoWeek')._d;
              var endDate   = moment().endOf('isoWeek')._d;
              break;
          };
          extractData(startDate, endDate, answersPeriod.period, answers.username);
          inquirer.prompt(checkData, function(answersData){
            if(answersData.dataCheck){
              inquirer.prompt(checkMail, function(answersCheckMail){
                if(answersCheckMail.mailCheck){
                  inquirer.prompt(configMail, function(answersConfigMail){
                    sendMail(answersConfigMail.mail, answersConfigMail.password, answersConfigMail.mailto, answers.username);
                  });
                }else{
                  console.log('Goodbye, see you soon :)');
                }
              });
            }else{
              console.log('Goodbye, see you soon :)');
            }
          });

        });
      }else{

      }
    });

  });
}


/**
* Extract data from .ics
*
*
*/

var extractData = function extractData(startDate, endDate, period, userName) {


  fs.readFile('./calendar.ics','utf8', function (err, calendar) {
    if (err) throw err;

    var ical = icalendar.parse_calendar(calendar);
    var events = ical.events();


    async.each(events, function(data,callback){

      if(data.properties.DTSTART[0].value > startDate && data.properties.DTEND[0].value < endDate && data.properties.TRANSP[0].value === 'OPAQUE' ){

        var eventLabel  = data.properties.SUMMARY[0].value;
        var eventStart = moment(data.properties.DTSTART[0].value, 'YYYY-M-DD HH:mm:ss');
        var eventEnd   = moment(data.properties.DTEND[0].value, 'YYYY-M-DD HH:mm:ss');
        var eventDuration = eventEnd.diff(eventStart, 'seconds', true);
            // eventDuration = moment(eventDuration).format("hh:mm");


        eventsItems.push ({
            label: eventLabel,
            duration: eventDuration,
        });

      }


      callback();


    }, function(err) {
      if(err) {
        console.log('There was an error, hmm it\'s embarrassing')
      }else{

        events  = {};
        eventsItems = _.groupBy(eventsItems, 'label');
        events.weekNumber = moment(endDate).isoWeeks();
        
        events.events = _(eventsItems).map(function(g, key) {
          var d;
          return {
              label: key,
              duration: _(g).reduce(function(m,x) {
                d = m + x.duration;
                return m + x.duration;
              }, 0),
              durationHumanized: moment.duration(d, "seconds").format("h[h]mm[min]"),
          };
        });


        console.log('\n\nThere is your reporting for week '+events.weekNumber+' ('+period+')');
        _.each(events.events, function(value){
          console.log('# '+value.label+' - '+value.durationHumanized);
        });

        template(events, userName);
        jsonData(events);
      }
    });

  });
}


/**
* Generate an html template
*
*/

var template = function template(events, username) {

  events = events || false;
  events.username = username || 'Anonymous';


  if(events) {
    var template = __dirname + '/template/mail.html.mustache';

    fs.stat(template, function(err, stat) {
      if(err == null) {

        var output = mustache.render(fs.readFileSync(template, 'utf8'), events);

        fs.writeFileSync("./template/build/template-generated.html", output, 'utf8');
      } else {
        console.log('Hmmm, i can\'t find your template file. :-/');
      }
    });

  }

};


var jsonData = function jsonData(events) {
  fs.writeFileSync("./template/build/data.json", JSON.stringify(events), 'utf8');
}

var sendMail = function sendMail(userMail, userPass, emailTo, userName) {

  var transport = nodemailer.createTransport(smtpTransport({
    service: "gmail",
    auth: {
      user: userMail,
      pass: userPass
    }
  }));

  fs.readFile('./template/build/template-generated.html', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }else{
      transport.sendMail({
        from: userMail,
        to: emailTo,
        subject: 'Reporting #'+moment().isoWeeks(),
        html: data,
        text: '',
      }, function(err, responseStatus) {
        if (err) {
          console.log(err);
        } else {
          console.log(userName+' your email has been sent, see you soon !');
        }
      });
    }
  });
};



questions();
