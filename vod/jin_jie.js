// ignore
//@name:[禁] 姐姐视频
//@version:1.1
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

/**
 * 姐姐视频（wap.jiejiesp19.xyz）
 * MacCMS 通用解析
 * 2025 可直接使用版本
 */
class jiejiespClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://wap.jiejiesp19.xyz'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
            'Referer': this.webSite
        }
    }

    /**
     * ===============================
     * 分类列表
     * ===============================
     */
    async getClassList(args) {
        let backData = new RepVideoClassList()
        try {
            const pro = await req(this.webSite + '/jiejie/', { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let document = parse(pro.data)
                let list = []

                let navs = document.querySelectorAll('.stui-header__menu a')
                for (let e of navs) {
                    let name = e.text?.trim()
                    let url = e.getAttribute('href')
                    if (!name || !url || name === '首页') continue

                    let vc = new VideoClass()
                    vc.type_name = name
                    vc.type_id = this.combineUrl(url)
                    list.push(vc)
                }
                backData.data = list
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /**
     * ===============================
     * 分类视频列表
     * ===============================
     */
    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let pageUrl = args.page > 1
                ? args.url.replace(/\.html$/, '') + `/page/${args.page}.html`
                : args.url

            const pro = await req(pageUrl, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let document = parse(pro.data)
                let list = []

                let items = document.querySelectorAll('.stui-vodlist li')
                for (let e of items) {
                    let vod = new VideoDetail()

                    vod.vod_id = this.combineUrl(
                        e.querySelector('.stui-vodlist__thumb')?.getAttribute('href')
                    )
                    vod.vod_name = e.querySelector('.title a')?.text?.trim()
                    vod.vod_pic = e.querySelector('.stui-vodlist__thumb')
                        ?.getAttribute('data-original')
                    vod.vod_remarks = e.querySelector('.pic-text')?.text ?? ''

                    if (vod.vod_id) list.push(vod)
                }
                backData.data = list
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /**
     * ===============================
     * 视频详情
     * ===============================
     */
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            const pro = await req(args.url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let document = parse(pro.data)
                let det = new VideoDetail()

                det.vod_id = args.url
                det.vod_name =
                    document.querySelector('.stui-content__detail h1')?.text ||
                    document.querySelector('h1')?.text

                det.vod_pic =
                    document.querySelector('.stui-content__thumb img')
                        ?.getAttribute('data-original')

                // MacCMS 单集播放
                det.vod_play_from = '姐姐视频'
                det.vod_play_url = '播放$' + args.url.replace(
                    '/detail/',
                    '/play/'
                ).replace('.html', '/sid/1/nid/1.html')

                backData.data = det
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /**
     * ===============================
     * 播放地址解析（核心）
     * ===============================
     */
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            const pro = await req(args.url, { headers: this.headers })
            backData.error = pro.error

            if (!pro.data) {
                backData.error = '播放页为空'
                return JSON.stringify(backData)
            }

            let html = pro.data

            // 匹配 MacCMS 播放器变量
            let match = html.match(/player_.*?=\s*(\{.*?\})/)
            if (!match) {
                backData.error = '未找到播放器数据'
                return JSON.stringify(backData)
            }

            let player = JSON.parse(match[1])
            let url = player.url || ''
            let encrypt = player.encrypt || 0

            // 解密处理
            if (encrypt === 1) {
                url = unescape(url)
            } else if (encrypt === 2) {
                url = decodeURIComponent(atob(url))
            }

            // 补全相对路径
            if (!url.startsWith('http')) {
                url = this.webSite + url
            }

            backData.data = url

        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /**
     * ===============================
     * URL 处理
     * ===============================
     */
    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        return this.webSite + url
    }
}

// 实例化
let jiejiesp2025 = new jiejiespClass()
