'use strict';

let coasters = [];
let projects = [];

const shifts =
  '<ul class="shifts"><li class="s1" data-shift=1></li><li class="s2" data-shift=2></li><li class="s3" data-shift=3></li><li class="s4" data-shift=4></li><li class="s5" data-shift=5></li><li class="s6" data-shift=6></li></ul>';
let coastersHtml = '';
const separatorHtml = "<div class='column coasters'></div>";

let month = new Date().getMonth() + 1;
let year = new Date().getYear() + 1900;

const months = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
if (year % 4 == 0) daysInMonths[1] = 29;

let when = gup('get');
if (when != null) {
  when = when.split('-');
  month = when[1];
  year = when[0];
}
const firstDay = new Date(year, month - 1, '1', '07', '00', '00').getDay();

const idUser = gup('user');
const idProject = gup('project');

const url = 'https://rollingtaskerbot.herokuapp.com/';

$(document).ready(() => {
  $('#month').text(`${months[month - 1]} ${year}`);

  for (var x = 0; x < days.length; x++) {
    $('#days').append(`<div class='column'>${days[x]}</div>`);
  }

  if ($('#projects').length > 0) {
    $('#projects').slimScroll({
      height: '400px',
    });
  }

  $('<i class="fa fa-angle-left fa-2x prev-month" onclick="prevMonth()"></i>').insertBefore('#month');
  $('<i class="fa fa-angle-right fa-2x next-month" onclick="nextMonth()"></i>').insertAfter('#month');

  if (!idUser && !idProject) {
    $.ajax({
      url: `${url}users`,
    }).done(data => {
      coasters = data.users;
      coastersHtml = '<div class="column coasters"><ul><li class="title"></li>';
      let coasterLogList = '';
      for (let i = 0; i < coasters.length; i++) {
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

      for (let x = 0; x < daysInMonths[month - 1]; x++) {
        let dayHtml = '<div class="column day';
        if (x == 0) {
          dayHtml += ` day-offset-${firstDay}`;
        } else if ((x + firstDay) % 7 == 1) $('#logs').append(`<hr />${coastersHtml}`);

        dayHtml += ` d${x}" data-date=${x + 1}><ul><li class="title">${x +
          1}</li>${coasterLogList}`;
        dayHtml += '</ul></div>';

        $('#logs').append(dayHtml);
      }
      getRecap();
    });
    $.ajax({
      url: `${url}projects`,
    }).done(data => {
      projects = data.projects;
      for (let i = 0; i < projects.length; i++) {
        if (projects[i].code != 'X') {
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
    for (var x = 0; x < daysInMonths[month - 1]; x++) {
      let dayHtml = '<div class="column day';
      if (x == 0) {
        dayHtml += ` day-offset-${firstDay}`;
      } else if ((x + firstDay) % 7 == 1) $('#logs').append(`<hr />${separatorHtml}`);

      dayHtml += ` d${x}" data-date=${x + 1}><ul><li class="title">${x +
        1}</li>${shifts}</ul></div>`;

      $('#logs').append(dayHtml);
    }
    if (idUser) {
      $.ajax({
        url: `${url}projects`,
      }).done(data => {
        projects = data.projects;
        for (let i = 0; i < projects.length; i++) {
          if (projects[i].code != 'X') {
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
        }).done(data => {
          const logs = data.logs;
          let date;
          let manday = 0;
          $('#coaster').text(data.user);
          if (typeof logs !== 'undefined') manday = logs.length;

          $('#manday').text(manday);
          for (let i = 0; i < manday; i++) {
            date = new Date(logs[i].date);
            if (date.getMonth() == month - 1) {
              date = date.getDate();
              $(`#logs .d${date - 1} .shifts .s${logs[i].shift}`).append(logs[i].projectId.code).addClass(`proj-${logs[i].projectId.code.replace(/[^\w\s]/gi, '')}`).attr('title', logs[i].content)
                .data('project-id', logs[i].projectId._id);
            }
          }
          for (let x = 0; x < projects.length; x++) {
            $(`.proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css({
              'background-color': $(`#projects .proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css('background-color'),
            });
          }
          $('.shifts li').click(function () {
            showPopup($(this));
          });
          if (firstDay == 0 || firstDay == 6) {
            $('html,body').scrollTop(200);
          }
        });
      });
    }
    if (idProject) {
      $('.shifts li').append('<p></p>');
      $.ajax({
        url: `${url}recap/${year}-${month}/project/${idProject}`,
      }).done(data => {
        const logs = data.logs;
        let date;
        $('#project').text(data.project);
        if (typeof logs !== 'undefined') {
          $('#manday').text(logs.length);
          for (let i = 0; i < logs.length; i++) {
            date = new Date(logs[i].date);
            if (date.getMonth() == month - 1) {
              date = date.getDate();
              $(`#logs .d${date - 1} .shifts .s${logs[i].shift} p`).append(`${logs[i].userId.alias} - ${logs[i].content}<br/>`);
            }
          }
          $('.shifts >li').each(function () {
            const _this = $(this);
            if (_this.find('p').innerHeight() > 125) {
              _this.slimScroll({ height: 125 });
            }
          });
        } else {
          $('#manday').text(0);
        }
      });
      $('.shifts').addClass('linear');
      if (firstDay == 0 || firstDay == 6) {
        $('html,body').scrollTop(850);
      }
    }
  }

  $(window).on('scroll', () => {
    $('.log-header').css({ marginTop: `${$(window).scrollTop()}px` });
  });
});

function getRecap() {
  if (firstDay == 0 || firstDay == 6) {
    $('html,body').scrollTop(600);
  }
  if (coasters.length > 0 && projects.length > 0) {
    $.ajax({
      url: `${url}recap/${year}-${month}`,
    }).done(data => {
      const logs = data.logs;
      let date;
      for (let i = 0; i < logs.length; i++) {
        date = new Date(logs[i].date);
        if (date.getMonth() == month - 1) {
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
      for (let x = 0; x < projects.length; x++) {
        $(`.proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css({
          'background-color': $(`#projects .proj-${projects[x].code.replace(/[^\w\s]/gi, '')}`).css('background-color'),
        });
      }
      $('.shifts li').click(function () {
        showPopup($(this));
      });
    });
  } else return;
}
function gup(name, url) {
  if (!url) url = location.href;
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regexS = `[\\?&]${name}=([^&#]*)`;
  const regex = new RegExp(regexS);
  const results = regex.exec(url);

  return results == null ? null : results[1];
}
function showPopup(elem) {
  $('.popup form')[0].reset();
  $('#projects-dropdown option').removeAttr('selected');
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
  $('.popup h3').text(`${name} | Shift ${shift}, ${date} ${$('#month').text()}`);
  if (elem.text != '' && typeof elem.attr('title') !== 'undefined') {
    $('.popup p').text(`[${elem.text()}] - ${elem.attr('title')}`);
    $('#input_log').val(elem.attr('title'));
    $(`#projects-dropdown option[value='${elem.data('project-id')}']`).attr(
      'selected',
      'selected'
    );
  } else {
    $('.popup p').html('<i>Kamu belum mengisi log, huh.</i>');
  }
  // $(".popup input").val("/log "+shift+" "+date+" "+month+" "+year);
  $('.popup').fadeIn();
}
function prevMonth() {
  let _target = window.location.origin + window.location.pathname;
  if (month == 1) {
    year--;
    month = 12;
  } else month--;
  _target += `?get=${year}-${month}`;

  if (idUser) _target += `&user=${idUser}`;
  if (idProject) _target += `&project=${idProject}`;
  window.location.href = _target;
}
function nextMonth() {
  let _target = window.location.origin + window.location.pathname;
  if (month == 12) {
    year++;
    month = 1;
  } else month++;
  _target += `?get=${year}-${month}`;

  if (idUser) _target += `&user=${idUser}`;
  if (idProject) _target += `&project=${idProject}`;
  window.location.href = _target;
}

$('.popup .content').click(e => {
  e.stopPropagation();
  e.preventDefault();
});
$('.popup .close').click(function () {
  $(this)
    .parents('.popup')
    .fadeOut();
});
$('.popup').click(function () {
  $(this).fadeOut();
});
$('.popup .btn').click(e => {
  e.preventDefault();
  // $(".popup input").select();
  // document.execCommand("copy");
  // $(".notice").fadeIn();
  // setTimeout(function(){
  // 	$(".notice").fadeOut();
  // },1000)
  $.post(`${url}log`, $('#log-form').serialize()).done(data => {
    location.reload();
  });
});
