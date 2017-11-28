// Only For English Project Only.
// Create portlet link
var portletLinkOnline = mw.util.addPortletLink(
    'p-personal',
    '#',
    'Online users with advanced rights',
    't-onlineadmin',
    'Seek help from these users.      Note: The action query tends to be quite long when the number of recent edits was high. This is a currrently unsolved problem.',
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

        // 最近更改30分钟内的编辑用户
        time = new Date();
        rcstart = time.toISOString();
        time.setMinutes(time.getMinutes() - 15);
        rcend = time.toISOString();

        //API:RecentChanges
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

                // 使用者名稱去重與分割
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

                // 查询用户权限
                $.when.apply($, promises).done(function () {
                    // 消除空值
                    var filter = function(n) {
                        return n;
                    };
                    
                    admins = admins.filter(filter);
                    rollbackers = rollbackers.filter(filter);
                    patrollers = patrollers.filter(filter);

                    var userlink = function(user) {
                        var user2 = user.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&lt;');
                        return '<br><a href="/wiki/User:' + user2 + '" target="_blank">' + user2 + '</a>&nbsp;<small style="opacity:.75;">(<a href="/wiki/User talk:' + user2 + '" target="_blank">Talk</a>)</small>　';
                    };
                    
                    if (admins.length + rollbackers.length + patrollers.length > 0) {
                        var adminsstring = ['<center><p><b>Current online users with advanced rights</b></p></center>'];

                        if (admins.length > 0) {
                            adminsstring.push('<p style="word-break:break-all;">There are currently ' + admins.length + ' administrators <br> online:');
                            $.each(admins, function(i, e) {
                                adminsstring.push(userlink(e));
                            });
                            adminsstring.push('</p>');
                        }

                        if (patrollers.length > 0) {
                            adminsstring.push('<p style="word-break:break-all;">There are currently ' + patrollers.length + ' patrollers <br>online:');
                            $.each(patrollers, function(i, e) {
                                adminsstring.push(userlink(e));
                            });
                            adminsstring.push('</p>');
                        }

                        if (rollbackers.length > 0) {
                            adminsstring.push('<p style="word-break:break-all;">There are currently ' + rollbackers.length + ' rollbackers <br>online');
                            $.each(rollbackers, function(i, e) {
                                adminsstring.push(userlink(e));
                            });
                            adminsstring.push('</p>');
                        }

                        mw.notify($(adminsstring.join('')));
                    } else {
                        mw.notify('Sorry! You cannot find help currently as there are no users online');
                    }
                }).fail(function () {
                    mw.notify('Error 404 - Connection not found');
                });
            });
        });
    });
