class jiejieClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://wap.jiejiesp19.xyz'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://wap.jiejiesp19.xyz/',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }
    }

    async getClassList() {
        let backData = new RepVideoClassList()
        try {
            let list = []
            let cls = [
                ['293', '姐姐资源'],
                ['86', '奥斯卡资源'],
                ['117', '森林资源'],
                ['337', '玉兔资源']
            ]
            for (let c of cls) {
                let vc = new VideoClass()
                vc.type_id = c[0]
                vc.type_name = c[1]
                list.push(vc)
            }
            backData.data = list
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/type/id/${args.url}/page/${page}.html`
            let res = await req(url, { headers: this.headers })
            let doc = parse(res.data)
            let items = doc.querySelectorAll('ul.stui-vodlist li')
            let videos = []

            for (let el of items) {
                let a = el.querySelector('h4.title a')
                let thumb = el.querySelector('a.stui-vodlist__thumb')
                if (!a || !thumb) continue
                videos.push({
                    vod_id: this.combineUrl(a.getAttribute('href')),
                    vod_name: a.text.trim(),
                    vod_pic: thumb.getAttribute('data-original') || '',
                    vod_remarks: el.querySelector('span.pic-text')?.text?.trim() || ''
                })
            }
            backData.data = videos
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let url = args.url
            let res = await req(url, { headers: this.headers })
            let doc = parse(res.data)

            let vodId = url.match(/id\/(\d+)/)?.[1] ?? ''

            let det = new VideoDetail()
            det.vod_id = url
            det.vod_name = doc.querySelector('h1.title')?.text?.trim() || ''
            det.vod_content = doc.querySelector('.stui-content__desc')?.text?.trim() || ''
            det.vod_pic =
                doc.querySelector('.stui-content__thumb img')?.getAttribute('data-original') ||
                doc.querySelector('.stui-content__thumb img')?.getAttribute('src') ||
                ''

            det.vod_play_from = '默认线路'
            det.vod_play_url =
                `正片$${this.webSite}/jiejie/index.php/vod/play/id/${vodId}/sid/1/nid/1.html#`

            backData.data = det
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    // ✅ 终极播放解析（不 JSON.parse）
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            let res = await req(args.url, { headers: this.headers })
            let html = res.data.toString()

            // 直接抓 url
            let urlMatch = html.match(/"url"\s*:\s*"([^"]+)"/)
            if (!urlMatch) throw new Error('play url not found')

            let playUrl = urlMatch[1]

            // 抓 encrypt
            let encMatch = html.match(/"encrypt"\s*:\s*(\d+)/)
            let encrypt = encMatch ? parseInt(encMatch[1]) : 0

            if (encrypt === 1) {
                playUrl = atob(playUrl)
            } else if (encrypt === 2) {
                playUrl = decodeURIComponent(escape(atob(playUrl)))
            }

            backData.data = playUrl
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/search/wd/${encodeURIComponent(
                args.searchWord
            )}/page/${page}.html`
            let res = await req(url, { headers: this.headers })
            let doc = parse(res.data)
            let items = doc.querySelectorAll('ul.stui-vodlist li')
            let videos = []

            for (let el of items) {
                let a = el.querySelector('h4.title a')
                let thumb = el.querySelector('a.stui-vodlist__thumb')
                if (!a || !thumb) continue
                videos.push({
                    vod_id: this.combineUrl(a.getAttribute('href')),
                    vod_name: a.text.trim(),
                    vod_pic: thumb.getAttribute('data-original') || '',
                    vod_remarks: el.querySelector('span.pic-text')?.text?.trim() || ''
                })
            }
            backData.data = videos
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        if (url.startsWith('/')) return this.webSite + url
        return this.webSite + '/' + url
    }
}

var jiejie2025 = new jiejieClass()
