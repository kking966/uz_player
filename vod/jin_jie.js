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
            let cls = [
                ['293', '姐姐资源'],
                ['86', '奥斯卡资源'],
                ['117', '森林资源'],
                ['337', '玉兔资源']
            ]
            backData.data = cls.map(c => {
                let v = new VideoClass()
                v.type_id = c[0]
                v.type_name = c[1]
                return v
            })
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
            let html = (await req(url, { headers: this.headers })).data
            let doc = parse(html)
            let items = doc.querySelectorAll('ul.stui-vodlist li')
            backData.data = [...items].map(el => ({
                vod_id: this.combineUrl(el.querySelector('h4 a')?.getAttribute('href')),
                vod_name: el.querySelector('h4 a')?.text?.trim(),
                vod_pic: el.querySelector('.stui-vodlist__thumb')?.getAttribute('data-original') || '',
                vod_remarks: el.querySelector('.pic-text')?.text?.trim() || ''
            })).filter(v => v.vod_id)
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let vodId = args.url.match(/id\/(\d+)/)?.[1]
            let html = (await req(args.url, { headers: this.headers })).data
            let doc = parse(html)

            let det = new VideoDetail()
            det.vod_id = args.url
            det.vod_name = doc.querySelector('h1.title')?.text?.trim()
            det.vod_content = doc.querySelector('.stui-content__desc')?.text?.trim()
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

    // ⭐⭐ 真正可播放的关键函数
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            let playHtml = (await req(args.url, { headers: this.headers })).data.toString()

            // 1️⃣ 抓 player_data.url
            let urlMatch = playHtml.match(/"url"\s*:\s*"([^"]+)"/)
            let encMatch = playHtml.match(/"encrypt"\s*:\s*(\d+)/)
            if (!urlMatch) throw new Error('param url not found')

            let paramUrl = urlMatch[1]
            let encrypt = encMatch ? parseInt(encMatch[1]) : 0

            if (encrypt === 1) paramUrl = atob(paramUrl)
            if (encrypt === 2) paramUrl = decodeURIComponent(escape(atob(paramUrl)))

            // 2️⃣ 请求播放器接口（关键）
            let apiUrl = `${this.webSite}/jiejie/player/player.php?url=${encodeURIComponent(paramUrl)}`
            let apiRes = await req(apiUrl, {
                headers: { ...this.headers, Referer: args.url }
            })

            let apiHtml = apiRes.data.toString()

            // 3️⃣ 抓真正 m3u8
            let realMatch = apiHtml.match(/(https?:\/\/[^"' ]+\.m3u8[^"' ]*)/)
            if (!realMatch) throw new Error('real m3u8 not found')

            backData.data = realMatch[1]
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
            let html = (await req(url, { headers: this.headers })).data
            let doc = parse(html)
            let items = doc.querySelectorAll('ul.stui-vodlist li')
            backData.data = [...items].map(el => ({
                vod_id: this.combineUrl(el.querySelector('h4 a')?.getAttribute('href')),
                vod_name: el.querySelector('h4 a')?.text?.trim(),
                vod_pic: el.querySelector('.stui-vodlist__thumb')?.getAttribute('data-original') || '',
                vod_remarks: el.querySelector('.pic-text')?.text?.trim() || ''
            })).filter(v => v.vod_id)
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
