// About this program:
// This program was done with implementation of codes, and combined codes of both Alexander Misel and Vjudge1
// Program was used for Chinese Wikipedia only. For English Wikipedia, please check in the English Box
// Version: 1.2
// Create Portlet Link
var portletLinkOnline = mw.util.addPortletLink(
    'p-personal',
    '#',
    '管理人員',
    't-onlineadmin',
    '查看当前在线管理员',
    '',
    '#pt-userpage'
);
    var rcstart, rcend, time;
    var users = [];
    var admins = [], rollbackers = [], patrollers = [];
    var api = new mw.Api();

    // Bind click handler
    $(portletLinkOnline).click(function(e) {
        e.preventDefault();

        users = [];
        var usersExt = [];
        admins = [];
        rollbackers = [];
        patrollers = [];

        // Recent Changes Detector
        time = new Date();
        rcstart = time.toISOString();
        time.setMinutes(time.getMinutes() - 15);
        rcend = time.toISOSring();

        //API:RecentChanges, Remove Bots and others
        api.get({
            format: 'json',
            action: 'query',
            list: 'recentchanges',
            rcprop: 'user',
            rcstart: rcstart,
            rcend: rcend,
            rcshow: '!bot|!anon',
            rclimit: 500
        }).done(function(data) {
            $.each(data.query.recentchanges, function(i, item) {
                users[i] = item.user;
            });
            api.get({
                format: 'json',
                action: 'query',
                list: 'logevents',
                leprop: 'user',
                lestart: rcstart,
                leend: rcend,
                lelimit: 500
            }).done(function(data) {
                $.each(data.query.logevents, function(i, item) {
                    usersExt[i] = item.user;
                });

                Array.prototype.push.apply(users, usersExt);

                // Remove non-unique Usernames
                users = $.unique(users.sort());

                var promises = [];
                var mark = function(data) {
                    $.each(data.query.users, function(i, user) {
                        // 找到管理员，去除adminbot
                        if ($.inArray('bot', user.groups) === -1) {
                            if ($.inArray('sysop', user.groups) > -1) {
                                admins[i] = user.name;
                            }
                            if ($.inArray('rollbacker', user.groups) > -1) {
                                rollbackers[i] = user.name;
                            }
                            if ($.inArray('patroller', user.groups) > -1) {
                                patrollers[i] = user.name;
                            }
                        }
                    });
                };
                for (var i=0; i<(users.length+50)/50; i++) {
                    promises.push(api.get({
                        format: 'json',
                        action: 'query',
                        list: 'users',
                        ususers: users.slice(i*50, (i+1)*50).join('|'),
                        usprop: 'groups'
                    }).done(mark));
                }

                // Check User Group
                $.when.apply($, promises).done(function () {
                    // Remove Users without User Group
                    var filter = function(n) {
                        return n;
                    };
                    
                    admins = admins.filter(filter);
                    rollbackers = rollbackers.filter(filter);
                    patrollers = patrollers.filter(filter);

                    var userlink = function(user) {
                        var user2 = user.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&lt;');
                        return '<br><a href="/wiki/User:' + user2 + '" target="_blank">' + user2 + '</a>&nbsp;<small style="opacity:.75;">(<a href="/wiki/User talk:' + user2 + '" target="_blank">留言</a>)</small>　';
                    };
                    
                    if (admins.length + rollbackers.length + patrollers.length > 0) {
                        var adminsstring = ['<p>當前在線管理人員</p>'];

                        if (admins.length > 0) {
                            adminsstring.push('<p style="word-break:break-all;">有' + admins.length + '個管理員在線：');
                            $.each(admins, function(i, e) {
                                adminsstring.push(userlink(e));
                            });
                            adminsstring.push('</p>');
                        }

                        if (patrollers.length > 0) {
                            adminsstring.push('<p style="word-break:break-all;">有' + patrollers.length + '個巡查員在線：');
                            $.each(patrollers, function(i, e) {
                                adminsstring.push(userlink(e));
                            });
                            adminsstring.push('</p>');
                        }

                        if (rollbackers.length > 0) {
                            adminsstring.push('<p style="word-break:break-all;">有' + rollbackers.length + '個回退員在線：');
                            $.each(rollbackers, function(i, e) {
                                adminsstring.push(userlink(e));
                            });
                            adminsstring.push('</p>');
                        }

                        mw.notify($(adminsstring.join('')));
                    } else {
                        mw.notify('現在沒有管理人員在線');
                    }
                }).fail(function () {
                    mw.notify('查詢時出現錯誤');
                });
            });
        });
    });
