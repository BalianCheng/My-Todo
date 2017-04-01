/**
 * Created by Dovahkiin on 2017/3/29.
 */
;(function () {
    'use strict'
    var $form_add_task = $(".add-task")
        , $window = $('window')
        , task_list = {}
        , $task_delete
        , $body = $('body')
        , $task_detail_tigger
        , $task_detail = $(".task-detail")
        , $task_detail_mask = $('.task-detail-mask')
        , current_index
        , $update_form
        , $task_detail_content
        , $task_detail_content_input
        , $checkbox_complete
        , $msg = $('.msg')
        , $msg_content = $msg.find('.msg-Content')
        , $msg_confirm = $msg.find('button')
        , $alerter = $('.alerter')[0]
    ;
    init()
    $form_add_task.on('submit', on_add_task_form_submit)
    $task_detail_mask.on('click', hide_task_detail)
    $('h1').on('click', hide_task_detail)
    function listen_msg_event() {
        $msg_confirm.on('click', function () {
            hide_msg()
        })
    }

    function on_add_task_form_submit(e) {
        //禁用默认行为
        e.preventDefault()
        var new_task = {}
        var $input = $(this).find('input[name=content]')
        if (!$input.val())
            return
        new_task.content = $input.val()
        if (!new_task) return
        if (add_task(new_task)) {
            render_task_list()
            $input.val(null)
        }
    }


    function init() {/*初始化storage*/
        task_list = store.get('task_list') || []
        if (task_list.length)
            render_task_list()
        task_remind_check()
        listen_msg_event()
    }

    function task_remind_check() {
        var current_timeStamp
        var itl = setInterval(function () {
            for (var i = 0, len = task_list.length; i < len; i++) {
                var item = get(i)
                    , task_timeStamp
                if (!item || !item.remind_date || item.informed)
                    continue
                current_timeStamp = (new Date()).getTime()
                task_timeStamp = (new Date(item.remind_date)).getTime()
                if (task_timeStamp - current_timeStamp >= 1) {
                    update_task(i, {informed: true})
                    show_msg(item.content)
                }
            }
        }, 500)
    }

    function show_msg(msg) {
        if (!msg) return
        $msg_content.html(msg)//Todo 弹窗提醒
        $alerter.play()
        $msg.show()
    }

    function hide_msg() {
        $msg.hide()
        $alerter.pause()
        $alerter.currentTime = 0
    }

    function get(index) {
        return store.get('task_list')[index]
    }


    function alert_confirm(arg) {/*alert window*/
        if (!arg) {
            console.error("title is required!")
        }
        var conf = {}
            , $alert_box
            , $alert_mask
            , $title
            , $content
            , $confirm
            , $cancel
            , dfd
            , confirmed
            , timer
            , $btn
        ;
        dfd = $.Deferred();

        if (typeof arg == 'string') {
            conf.title = arg
        }
        else {
            conf = $.extend(conf, arg)
        }
        $alert_box = $('<div>' +
            '<div class="box_title">提示</div>' +
            '<div class="box_content">' + conf.title + '</div>' +
            '<div class="btn"><button class="primary" type="button">确定</button><button class="cancel" type="button">取消</button></div>' +
            '</div>').css({
            height: 150,
            width: 300,
            background: '#ffffff',
            color: '#444',
            'border-radius': 3,
            'box-shadow': '0 1px 2px rgba(0,0,0,0.5)',
            position: 'relative',
            margin: '0 auto',

        })
        $alert_box.find('.btn').css({
            bottom: '5'
        })
        $title = $alert_box.find('.box_title').css({
            padding: '5px 10px',
            'font-weight': 900,
            'font-size': 20,
            background: '#4eaff5',
            'border-radius': '3 0 0 3',
            'text-align': 'center',
        })
        $content = $alert_box.find('.box_content').css({
            padding: '5px 10px',
            'text-align': 'center',
            'vertical-align': 'middle',
            top: 20,
            position: 'relative',
        })
        $alert_mask = $('<div></div>').css({
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'rgba(30, 30, 30, 0.4)',
        })
        $btn = $alert_box.find('.btn')
        $confirm = $btn.find('button.primary');
        $cancel = $btn.find('button.cancel');
        timer = setInterval(function () {
            if (confirmed !== undefined) {
                dfd.resolve(confirmed)
                clearInterval(timer)
                dismiss_alert()
            }
        }, 50)
        $confirm.on('click', function () {
            confirmed = true
        })
        $cancel.on('click', function () {
            confirmed = false
        })
        $alert_mask.on('click', function () {
            confirmed = false
        })

        function dismiss_alert() {
            $alert_mask.remove()
            $alert_box.remove()
        }

        function adjust_box_position() {
            var window_width = $window.width()
                , window_height = $window.height()
                , box_width = $alert_box.width()
                , box_height = $alert_box.height
                , move_x
                , move_y
            ;
            move_x = (window_width - box_width) / 2
            move_y = (window_height - box_height) / 2 - 20
            $alert_box.css({
                left: move_x,
                top: move_y,
            })
        }

        $window.on('resize', function () {
            adjust_box_position()
        })


        $alert_mask.appendTo($body)
        $alert_box.appendTo($body)
        $window.resize()
        return dfd.promise()
    }

    function listen_task_detail() {
        $task_detail_tigger.on("click", function () {
            var $this = $(this)
            var $item = $this.parent().parent()
            var index = $item.data('index')
            show_task_detail(index)
        })
    }

    /*查看task详情*/
    function show_task_detail(index) {
        render_task_detail(index)
        current_index = index
        $task_detail_mask.show()
        /*显示详细信息*/
        $task_detail.show()
    }

    function update_task(index, data) {
        if (!task_list[index] || (index < 0)) return
        task_list[index] = $.extend({}, task_list[index], data)
        refresh_task_list()
    }

    function hide_task_detail() {
        $task_detail_mask.hide()
        /*隐藏详细信息*/
        $task_detail.hide()
    }

    function render_task_detail(index) {
        /*task_detail详细信息*/
        if (index === undefined || !task_list[index])
            return
        var item = task_list[index]
        var tpl = '<form>' +
            '<div class="content">' +
            item.content +
            '</div>' +
            '<div class="input_item"><input style="display: none" type="text" name="content" value="' + (item.content || '') + '"></div>' +
            '<div>' +
            '<div class="desc input_item">' +
            '<textarea autofocus name="desc">' + (item.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind clearFix input_item">' +
            '<label for="remind_date">提醒时间</label>' +
            '<input type="text" id="remind_date" name="remind_date" value="' + (item.remind_date || '') + '">' +//Todo 当前时间
            '<button type="submit">更新</button>' +
            '</div>' +
            '</form>'
        $task_detail.html(null)
        $task_detail.html(tpl)
        $('#remind_date').datetimepicker()
        $update_form = $task_detail.find('form')
        $task_detail_content = $update_form.find('.content')
        $task_detail_content_input = $update_form.find('[name=content]')
        $task_detail_content.on("dblclick", function () {
            $task_detail_content.hide()
            $task_detail_content_input.show()
        })
        $update_form.on('submit', function (e) {
            e.preventDefault()
            var data = {}
            data.content = $(this).find('[name=content]').val()
            data.desc = $(this).find('textarea[name=desc]').val()
            data.remind_date = $(this).find('[name=remind_date]').val()
            update_task(index, data)
            hide_task_detail()
        })
    }

    function listen_task_delete() {
        $task_delete.on('click', function () {
            var $this = $(this)
            var $item = $this.parent().parent()
            var index = $item.data('index')
            alert_confirm('确定删除？').then(function (r) {
                r ? task_delete(index) : null
            })
        })
    }

    function listen_checkbox_complete() {//TODO checkbox状态选择
        $checkbox_complete.on('click', function () {
            var $this = $(this)
            var is_complete = $(this).is(':checked')
            var index = $this.parent().parent().data('index')
            var item = get(index)
            if (item.complete) {
                update_task(index, {complete: false})
            }
            else {
                update_task(index, {complete: true})
            }
        })
    }

    function add_task(new_task) {/*添加task到storage*/
        task_list.push(new_task)
        store.set('task_list', task_list)
        return true
    }

    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }

    function task_delete(index) {
        if (index === undefined || !task_list[index]) return
        delete task_list[index]
        refresh_task_list()
        /*删除task*/
    }

    function render_task_list() {
        var $task_list = $('.task-list')
        $task_list.html('')
        var complete_items = []
        for (var i = 0, len = task_list.length; i < len; i++) {
            var item = task_list[i]
            if (item && item.complete)
                complete_items[i] = item
            else
                var $task = render_task_item(task_list[i], i)
            $task_list.prepend($task)
        }
        for (var i = 0, len = complete_items.length; i < len; i++) {
            $task = render_task_item(complete_items[i], i)
            if (!$task) continue
            $task.addClass('completed')
            $task_list.append($task)
        }
        $task_delete = $('.anchor.delete')
        $task_detail_tigger = $('.anchor.detail')
        $checkbox_complete = $('.task-list .complete[type=checkbox]')
        listen_task_delete()
        listen_task_detail()
        listen_checkbox_complete()
    }

    function render_task_item(data, index) {/*返回单个task任务条*/
        if (!data || (index >= 0 ? false : true)) return;
        var list_item_tpl =
            '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="floatRight">' +
            '<span class="anchor delete"> 删除</span>' +
            '<span class="anchor detail"> 详细</span>' +
            '</span>' +
            '</div>';
        return $(list_item_tpl)
    }

})();