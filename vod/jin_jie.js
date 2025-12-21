// ignore
//@name:[禁] 姐姐视频
//@version:1.3
//@webSite:https://wap.jiejiesp19.xyz
//@type:100
//@instance:jiejiesp2025
//@isAV:1
//@order:E
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

function jiejiespClass() {
    WebApiBase.call(this)

    this.webSite = 'https://wap.jiejiesp19.xyz'
    this.headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Referer': this.webSite
    }
}

jiejiespClass.prototype = Object.create(WebApiBase.prototype)
jiejiespClass.prototype.constructor = jiejiespClass

// ===============================
// 分类
// ===============================
jiejiespClass.prototype.getClassList = async function (args) {
    var backData = new RepVideoClassList()
    try {
        var res = await req(this.webSite + '/jiejie/', { headers: this.headers })
        backData.error = res.error

        if (res.data) {
            var doc = parse(res.data)
            var list = []

            var navs = doc.querySelectorAll('.stui-header__menu a')
            for (var i = 0; i < navs.length; i++) {
                var n = navs[i]
                var name = n.text ? n.text.trim() : ''
                var href = n.getAttribute('href')
                if (!name || !href || name === '首页') continue

                var vc = new VideoClass()
                vc.type_name = name
                vc.type_id = this.combineUrl(href)
                list.push(vc)
            }
            backData.data = list
        }
    } catch (e) {
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

// ===============================
// 分类列表
// ===============================
jiejiespClass.prototype.getVideoList = async function (args) {
    var backData = new RepVideoList()
    try {
        var url = args.page > 1
            ? args.url.replace('.html', '') + '/page/' + args.page + '.html'
            : args.url

        var res = await req(url, { headers: this.headers })
        backData.error = res.error

        if (res.data) {
            var doc = parse(res.data)
            var list = []

            var items = doc.querySelectorAll('.stui-vodlist li')
            for (var i = 0; i < items.length; i++) {
                var it = items[i]
                var vod = new VideoDetail()

                var a = it.querySelector('.stui-vodlist__thumb')
                if (!a) continue

                vod.vod_id = this.combineUrl(a.getAttribute('href'))
                vod.vod_name = it.querySelector('.title a')
                    ? it.querySelector('.title a').text.trim()
                    : ''
                vod.vod_pic = a.getAttribute('data-original')
                vod.vod_remarks = it.querySelector('.pic-text')
                    ? it.querySelector('.pic-text').text
                    : ''

                if (vod.vod_id) list.push(vod)
            }
            backData.data = list
        }
    } catch (e) {
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

// ===============================
// 详情
// ===============================
jiejiespClass.prototype.getVideoDetail = async function (args) {
    var backData = new RepVideoDetail()
    try {
        var res = await req(args.url, { headers: this.headers })
        backData.error = res.error

        if (res.data) {
            var doc = parse(res.data)
            var vod = new VideoDetail()

            vod.vod_id = args.url
            vod.vod_name = doc.querySelector('h1')
                ? doc.querySelector('h1').text
                : ''

            var img = doc.querySelector('.stui-content__thumb img')
            vod.vod_pic = img ? img.getAttribute('data-original') : ''

            vod.vod_play_from = '姐姐视频'
            vod.vod_play_url =
                '播放$' +
                args.url
                    .replace('/detail/', '/play/')
                    .replace('.html', '/sid/1/nid/1.html')

            backData.data = vod
        }
    } catch (e) {
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

// ===============================
// 播放解析（稳定版）
// ===============================
jiejiespClass.prototype.getVideoPlayUrl = async function (args) {
    var backData = new RepVideoPlayUrl()
    try {
        var res = await req(args.url, { headers: this.headers })
        backData.error = res.error

        if (!res.data) {
            backData.error = '播放页为空'
            return JSON.stringify(backData)
        }

        var html = res.data
        var m = html.match(/player_[^=]+=\s*(\{[\s\S]*?\})/)

        if (!m) {
            backData.error = '未找到播放信息'
            return JSON.stringify(backData)
        }

        var player = JSON.parse(m[1])
        var url = player.url || ''
        var encrypt = Number(player.encrypt || 0)

        if (encrypt === 1) {
            url = unescape(url)
        } else if (encrypt === 2) {
            url = decodeURIComponent(atob(url))
        }

        if (url.indexOf('http') !== 0) {
            url = this.webSite + url
        }

        backData.data = url

    } catch (e) {
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

// ===============================
// URL 补全
// ===============================
jiejiespClass.prototype.combineUrl = function (url) {
    if (!url) return ''
    if (url.indexOf('http') === 0) return url
    return this.webSite + url
}

// 实例
var jiejiesp2025 = new jiejiespClass()
