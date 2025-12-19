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

        // 安全占位图，避免 Flutter 崩溃
        this.safePic = ''
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
                let a = it.querySelector('h4 a')
                if (!a) return null
                return {
                    vod_id: this.combineUrl(a.getAttribute('href')),
                    vod_name: a.text?.trim() || '',
                    vod_pic: this.safePic,   // ⭐ 不加载任何外图
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
            det.vod_pic = this.safePic

            det.vod_play_from = '默认线路'
            det.vod_play_url =
                `播放$${this.webSite}/jiejie/index.php/vod/play/id/${vodId}/sid/1/nid/1.html#`

            backData.data = det
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ✅ 播放：WebView 嗅探（唯一稳定） */
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        backData.data = {
            url: args.url,
            parse: 1   // ⭐ 核心：交给 UZ WebView 嗅探 m3u8
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
                let a = it.querySelector('h4 a')
                if (!a) return null
                return {
                    vod_id: this.combineUrl(a.getAttribute('href')),
                    vod_name: a.text?.trim() || '',
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
