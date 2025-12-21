// ignore
//@name:[禁] 姐姐视频
//@version:1.2
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

class jiejiespClass extends WebApiBase {

    constructor() {
        super()
        this.webSite = 'https://wap.jiejiesp19.xyz'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
            'Referer': this.webSite
        }
    }

    // ===============================
    // 分类
    // ===============================
    async getClassList(args) {
        let backData = new RepVideoClassList()
        try {
            let res = await req(this.webSite + '/jiejie/', { headers: this.headers })
            backData.error = res.error

            if (res.data) {
                let doc = parse(res.data)
                let list = []

                let navs = doc.querySelectorAll('.stui-header__menu a')
                for (let n of navs) {
                    let name = n.text?.trim()
                    let href = n.getAttribute('href')
                    if (!name || !href || name === '首页') continue

                    let vc = new VideoClass()
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
    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let url = args.page > 1
                ? args.url.replace('.html', '') + '/page/' + args.page + '.html'
                : args.url

            let res = await req(url, { headers: this.headers })
            backData.error = res.error

            if (res.data) {
                let doc = parse(res.data)
                let list = []

                let items = doc.querySelectorAll('.stui-vodlist li')
                for (let it of items) {
                    let vod = new VideoDetail()
                    vod.vod_id = this.combineUrl(
                        it.querySelector('.stui-vodlist__thumb')?.getAttribute('href')
                    )
                    vod.vod_name = it.querySelector('.title a')?.text?.trim()
                    vod.vod_pic = it.querySelector('.stui-vodlist__thumb')
                        ?.getAttribute('data-original')
                    vod.vod_remarks = it.querySelector('.pic-text')?.text || ''

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
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let res = await req(args.url, { headers: this.headers })
            backData.error = res.error

            if (res.data) {
                let doc = parse(res.data)
                let vod = new VideoDetail()

                vod.vod_id = args.url
                vod.vod_name =
                    doc.querySelector('.stui-content__detail h1')?.text ||
                    doc.querySelector('h1')?.text

                vod.vod_pic =
                    doc.querySelector('.stui-content__thumb img')
                        ?.getAttribute('data-original')

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
    // 播放解析（重点修复）
    // ===============================
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            let res = await req(args.url, { headers: this.headers })
            backData.error = res.error

            if (!res.data) {
                backData.error = '播放页为空'
                return JSON.stringify(backData)
            }

            let html = res.data

            // 不用 .*?，避免语法解析异常
            let reg = /player_[a-zA-Z0-9_]+\s*=\s*(\{[\s\S]*?\})/
            let match = html.match(reg)

            if (!match) {
                backData.error = '未找到 player 数据'
                return JSON.stringify(backData)
            }

            let player = JSON.parse(match[1])
            let playUrl = player.url || ''
            let encrypt = Number(player.encrypt || 0)

            if (encrypt === 1) {
                playUrl = unescape(playUrl)
            } else if (encrypt === 2) {
                playUrl = decodeURIComponent(atob(playUrl))
            }

            if (!playUrl.startsWith('http')) {
                playUrl = this.webSite + playUrl
            }

            backData.data = playUrl

        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    // ===============================
    // URL 补全
    // ===============================
    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        return this.webSite + url
    }
}

let jiejiesp2025 = new jiejiespClass()
