/* global $ */
/* eslint-env browser */
'use strict';

import './site.less';

import Vue from 'vue';
import Vuex from 'vuex';
import Router from 'vue-router';
import Axios from 'vue-axios';
import axios from 'axios';
import App from './App.vue';
import Index from './Index.vue';
import User from './User.vue';
import Project from './Project.vue';

import { parse, format, addMonths, getDaysInMonth, startOfMonth } from 'date-fns';
const fmt = format;//(...args) => format(...args, { locale });
const blacklist = [
  'Halida',
  'Vian',
];

Vue.use(Vuex);
Vue.use(Router);
Vue.use(Axios, axios);

const router = new Router({
  // mode: 'history',
  routes: [
    {
      path: '/:date?',
      name: 'Index',
      component: Index,
    },
    {
      path: '/user/:id',
      name: 'Users',
      component: User,
    },
    {
      path: '/project/:id',
      name: 'Projects',
      component: Project,
    },
  ],
});

const store = new Vuex.Store({
  state: {
    date: Date.now(),
    projects: Vue.axios.get('/projects').then((resp) => resp.data),
  },
  mutations: {
    prevMonth: (state) => addMonths(state.date, -1),
    nextMonth: (state) => addMonths(state.date, 1),
  },
});

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
});

//import * as locale from 'date-fns/locale/id';

function gup(name, url) {
  if (!url) url = location.href;
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regexS = `[\\?&]${name}=([^&#]*)`;
  const regex = new RegExp(regexS);
  const results = regex.exec(url);

  return results == null ? null : results[1];
}

let coasters = [];
let projects = [];

const shifts =
  '<ul class="shifts"><li class="s1" data-shift=1></li><li class="s2" data-shift=2></li><li class="s3" data-shift=3></li><li class="s4" data-shift=4></li><li class="s5" data-shift=5></li><li class="s6" data-shift=6></li></ul>';
let coastersHtml = '';
const separatorHtml = "<div class='column coasters'></div>";

let date = new Date();
let month = new Date().getMonth() + 1;
let year = new Date().getYear() + 1900;
let when = gup('get');
if (when) {
  date = parse(when);
  when = when.split('-');
  month = when[1];
  year = when[0];
}

const daysInMonths = [...Array(12)]
  .map((x, i) => getDaysInMonth(new Date(date.getFullYear(), i)));
const firstDay = startOfMonth(date).getDay();

const idUser = gup('user');
const idProject = gup('project');

const url = '/';

function showPopup(elem) {
  $('#log form')[0].reset();
  $('#log form option').removeAttr('selected');
  const date = elem.parents('.day').data('date');
  const shift = elem.data('shift');
  let name = elem.parents('.shift-owner').data('coaster');
  const id = elem.parents('.shift-owner').data('coaster-id');

  $('#log-user-id').val(id);
  $('#log-shift').val(shift);
  $('#log-date').val(`${date}/${month}/${year}`);

  if (typeof name === 'undefined') {
    name = $('#coaster').text();
  }

  $('#log .modal-header').text(`${name} | Shift ${shift}, ${date} ${$('#month').text()}`);

  if (elem.text !== '' && typeof elem.attr('title') !== 'undefined') {
    $('#input_log').val(elem.attr('title'));
    $(`#log option[value='${elem.data('project-id')}']`).attr('selected');
  }

  $('#log').modal();
}

function prevMonth() {
  let target = window.location.origin + window.location.pathname;
  if (month === 1) {
    year -= 1;
    month = 12;
  } else month -= 1;
  target += `?get=${year}-${month}`;

  if (idUser) target += `&user=${idUser}`;
  if (idProject) target += `&project=${idProject}`;
  window.location.href = target;
}

function nextMonth() {
  let target = window.location.origin + window.location.pathname;
  if (month === 12) {
    year += 1;
    month = 1;
  } else month += 1;
  target += `?get=${year}-${month}`;

  if (idUser) target += `&user=${idUser}`;
  if (idProject) target += `&project=${idProject}`;
  window.location.href = target;
}

function getRecap() {
  if (firstDay === 0 || firstDay === 6) {
    $('html,body').scrollTop(600);
  }
  if (coasters.length > 0 && projects.length > 0) {
    $.ajax({
      url: `${url}recap/${year}-${month}`,
    }).done((data) => {
      const logs = data.logs;
      let date;
      for (let i = 0; i < logs.length; i += 1) {
        date = new Date(logs[i].date);
        if (date.getMonth() === month - 1) {
          date = date.getDate();
          $(`#logs .d${date - 1} .${logs[
            i
          ].userId.alias.toLowerCase()} .shifts .s${logs[i].shift}`)
            .append(logs[i].projectId.code)
            .addClass(`proj-${logs[i].projectId.code.replace(/[^\w\s]/gi, '')}`)
            .attr('title', logs[i].content)
            .data('project-id', logs[i].projectId._id);
        }
      }
      for (let x = 0; x < projects.length; x += 1) {
        $(`.proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css({
          'background-color': $(`#projects .proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css('background-color'),
        });
      }
      $('.shifts li').click(function () {
        showPopup($(this));
      });
    });
  }
}

$(document).ready(() => {
  $('#month').text(fmt(date, 'MMMM YYYY'));


  [...Array(7)]
    .map((x, i) => fmt(new Date(0, 0, i + 1), 'dddd'))
    .forEach(x => $('#days').append(`<div class='column'>${x}</div>`));

  if ($('#projects').length > 0) {
    $('#projects').slimScroll({
      height: '400px',
    });
  }

  $('<i class="fa fa-angle-left fa-2x prev-month"></i>')
    .insertBefore('#month')
    .on('click', prevMonth);
  $('<i class="fa fa-angle-right fa-2x next-month"></i>')
    .insertAfter('#month')
    .on('click', nextMonth);

  if (!idUser && !idProject) {
    $.ajax(`${url}users`).done((data) => {
      coasters = data.users.filter(coaster => !blacklist.includes(coaster.alias));
      coastersHtml = '<div class="column coasters"><ul><li class="title"></li>';
      let coasterLogList = '';
      for (let i = 0; i < coasters.length; i += 1) {
        coastersHtml += `<li><a href="byuser.html?user=${coasters[i]._id}">${
          coasters[i].alias
        }</a></li>`;
        coasterLogList += `<li class="shift-owner ${coasters[i].alias.toLowerCase()}" data-coaster="${
          coasters[i].alias
        }" data-coaster-id="${coasters[i]._id}">${shifts}</li>`;
      }
      coastersHtml += '</ul></div>';
      coasterLogList += '';

      $('#logs').append(coastersHtml);

      for (let x = 0; x < daysInMonths[month - 1]; x += 1) {
        let dayHtml = '<div class="column day';
        if (x === 0) {
          dayHtml += ` day-offset-${firstDay}`;
        } else if ((x + firstDay) % 7 === 1) $('#logs').append(`<hr />${coastersHtml}`);

        dayHtml += ` d${x}" data-date=${x + 1}><ul><li class="title">${x +
          1}</li>${coasterLogList}`;
        dayHtml += '</ul></div>';

        $('#logs').append(dayHtml);
      }
      getRecap();
    });

    $.ajax({
      url: `${url}projects`,
    }).done((data) => {
      projects = data.projects;
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].code !== 'X') {
          $('#projects').append(`<li><div class="code proj-${
            projects[i].code.replace(/[^\w\s]/gi, '')
          }"><a href="byproject.html?project=${
            projects[i]._id
          }">${
            projects[i].code
          }</a></div><div class="title"><a href="byproject.html?project=${
            projects[i]._id
          }">${
            projects[i].name
          }</a></div></li>`);
        }
        $('#projects-dropdown').append(`<option value="${projects[i]._id}">${projects[i].code}</option>`);
      }
      getRecap();
    });
  } else {
    for (let x = 0; x < daysInMonths[month - 1]; x += 1) {
      let dayHtml = '<div class="column day';
      if (x === 0) {
        dayHtml += ` day-offset-${firstDay}`;
      } else if ((x + firstDay) % 7 === 1) $('#logs').append(`<hr />${separatorHtml}`);

      dayHtml += ` d${x}" data-date=${x + 1}><ul><li class="title">${x +
        1}</li>${shifts}</ul></div>`;

      $('#logs').append(dayHtml);
    }
    if (idUser) {
      $.ajax({
        url: `${url}projects`,
      }).done((data) => {
        projects = data.projects;
        for (let i = 0; i < projects.length; i += 1) {
          if (projects[i].code !== 'X') {
            $('#projects').append(`<li><div class="code proj-${
              projects[i].code.replace(/[^\w\s]/gi, '')
            }"><a href="byproject.html?project=${
              projects[i]._id
            }">${
              projects[i].code
            }</a></div><div class="title"><a href="byproject.html?project=${
              projects[i]._id
            }">${
              projects[i].name
            }</a></div></li>`);
          }
        }
        $.ajax({
          url: `${url}recap/${year}-${month}/user/${idUser}`,
        }).done((data) => {
          const logs = data.logs;
          let date;
          let manday = 0;
          $('#coaster').text(data.user);
          if (typeof logs !== 'undefined') manday = logs.length;

          $('#manday').text(manday);
          for (let i = 0; i < manday; i += 1) {
            date = new Date(logs[i].date);
            if (date.getMonth() === month - 1) {
              date = date.getDate();
              $(`#logs .d${date - 1} .shifts .s${logs[i].shift}`).append(logs[i].projectId.code).addClass(`proj-${logs[i].projectId.code.replace(/[^\w\s]/gi, '')}`).attr('title', logs[i].content)
                .data('project-id', logs[i].projectId._id);
            }
          }
          for (let x = 0; x < projects.length; x += 1) {
            $(`.proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css({
              'background-color': $(`#projects .proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css('background-color'),
            });
          }
          $('.shifts li').click(function () {
            showPopup($(this));
          });
          if (firstDay === 0 || firstDay === 6) {
            $('html,body').scrollTop(200);
          }
        });
      });
    }
    if (idProject) {
      $('.shifts li').append('<p></p>');
      $.ajax({
        url: `${url}recap/${year}-${month}/project/${idProject}`,
      }).done((data) => {
        const logs = data.logs;
        let date;
        $('#project').text(data.project);
        if (typeof logs !== 'undefined') {
          $('#manday').text(logs.length);
          for (let i = 0; i < logs.length; i += 1) {
            date = new Date(logs[i].date);
            if (date.getMonth() === month - 1) {
              date = date.getDate();
              $(`#logs .d${date - 1} .shifts .s${logs[i].shift} p`).append(`${logs[i].userId.alias} - ${logs[i].content}<br/>`);
            }
          }
          $('.shifts >li').each(function () {
            const that = $(this);
            if (that.find('p').innerHeight() > 125) {
              that.slimScroll({ height: 125 });
            }
          });
        } else {
          $('#manday').text(0);
        }
      });
      $('.shifts').addClass('linear');
      if (firstDay === 0 || firstDay === 6) {
        $('html,body').scrollTop(850);
      }
    }
  }

  $(window).on('scroll', () => {
    $('.log-header').css({ marginTop: `${$(window).scrollTop()}px` });
  });
});

$('#log-form').submit((e) => {
  e.preventDefault();
  $.post(`${url}log`, $(e.target).serialize()).done((data) => {
    location.reload();
  });
});
