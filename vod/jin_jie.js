class jiejieClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://wap.jiejiesp19.xyz'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Referer': this.webSite + '/',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }

        // ✅ 永不崩溃的兜底封面（本地 / 空图）
        this.safePic =
            'https://via.placeholder.com/300x400.png?text=VIDEO'
    }

    /* 分类 */
    async getClassList() {
        let backData = new RepVideoClassList()
        backData.data = [
            ['293', '姐姐资源'],
            ['86', '奥斯卡资源'],
            ['117', '森林资源'],
            ['337', '玉兔资源']
        ].map(c => {
            let v = new VideoClass()
            v.type_id = c[0]
            v.type_name = c[1]
            return v
        })
        return JSON.stringify(backData)
    }

    /* 列表 */
    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/type/id/${args.url}/page/${page}.html`
            let html = (await req(url, { headers: this.headers })).data
            let doc = parse(html)

            let items = doc.querySelectorAll('ul.stui-vodlist li')
            backData.data = [...items].map(it => {
                let id = this.combineUrl(it.querySelector('h4 a')?.getAttribute('href'))
                if (!id) return null

                return {
                    vod_id: id,
                    vod_name: it.querySelector('h4 a')?.text?.trim() || '',
                    vod_pic: this.safePic,      // ⭐ 强制安全封面
                    vod_remarks: it.querySelector('.pic-text')?.text?.trim() || ''
                }
            }).filter(Boolean)
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* 详情 */
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let vodId = args.url.match(/id\/(\d+)/)?.[1]
            let html = (await req(args.url, { headers: this.headers })).data
            let doc = parse(html)

            let det = new VideoDetail()
            det.vod_id = args.url
            det.vod_name = doc.querySelector('h1.title')?.text?.trim() || ''
            det.vod_content =
                doc.querySelector('.data-more p:last-child')?.text?.trim() || ''
            det.vod_pic = this.safePic   // ⭐ 详情页也不信任外图

            det.vod_play_from = 'aosika'
            det.vod_play_url =
                `正片$${this.webSite}/jiejie/index.php/vod/play/id/${vodId}/sid/1/nid/1.html#`

            backData.data = det
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* 🔥 播放：直解析 → 失败回退 WebView */
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            let html = (await req(args.url, { headers: this.headers })).data

            // 直解析 m3u8
            let m3u8 =
                html.match(/"url"\s*:\s*"(https?:\/\/[^"]+\.m3u8)"/)?.[1]

            if (m3u8) {
                backData.data = {
                    url: m3u8,
                    parse: 0,
                    header: {
                        'User-Agent': this.headers['User-Agent'],
                        'Referer': args.url
                    }
                }
            } else {
                // 🔁 兜底：WebView 嗅探
                backData.data = {
                    url: args.url,
                    parse: 1
                }
            }
        } catch (e) {
            // ❌ 网络 / 解析异常 → 强制回退嗅探
            backData.data = {
                url: args.url,
                parse: 1
            }
        }
        return JSON.stringify(backData)
    }

    /* 搜索 */
    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/search/wd/${encodeURIComponent(
                args.searchWord
            )}/page/${page}.html`
            let html = (await req(url, { headers: this.headers })).data
            let doc = parse(html)

            let items = doc.querySelectorAll('ul.stui-vodlist li')
            backData.data = [...items].map(it => {
                let id = this.combineUrl(it.querySelector('h4 a')?.getAttribute('href'))
                if (!id) return null

                return {
                    vod_id: id,
                    vod_name: it.querySelector('h4 a')?.text?.trim() || '',
                    vod_pic: this.safePic,
                    vod_remarks: it.querySelector('.pic-text')?.text?.trim() || ''
                }
            }).filter(Boolean)
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        return this.webSite + (url.startsWith('/') ? url : '/' + url)
    }
}

var jiejie2025 = new jiejieClass()
