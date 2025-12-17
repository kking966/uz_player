class jiejieClass extends WebApiBase {
    constructor() {
        super()
        // 必须使用 wap 域名
        this.webSite = 'https://wap.jiejiesp19.xyz'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://wap.jiejiesp19.xyz/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }
    }

    /* ================= 分类 ================= */
    async getClassList(args) {
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

    /* ================= 分类列表 ================= */
    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/type/id/${args.url}/page/${page}.html`
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let doc = parse(pro.data)
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
                        vod_remarks:
                            el.querySelector('span.pic-text')?.text?.trim() || ''
                    })
                }
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 详情 ================= */
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let url = args.url
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let doc = parse(pro.data)

                let det = new VideoDetail()
                det.vod_id = url
                det.vod_name = doc.querySelector('h1.title')?.text?.trim() || ''
                det.vod_content =
                    doc.querySelector('.stui-content__desc')?.text?.trim() || ''
                det.vod_pic =
                    doc
                        .querySelector('.stui-content__thumb img')
                        ?.getAttribute('data-original') ||
                    doc
                        .querySelector('.stui-content__thumb img')
                        ?.getAttribute('src') ||
                    ''

                let vodId = url.match(/id\/(\d+)/)?.[1] ?? ''

                // 关键：这里直接给“完整播放页 URL”
                det.vod_play_from = '姐姐视频'
                det.vod_play_url =
                    `正片$${this.webSite}/jiejie/index.php/vod/play/id/${vodId}/sid/1/nid/1.html#`

                backData.data = det
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 播放 ================= */
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            // args.url 现在一定是“播放页 URL”
            let playPageUrl = args.url
            let playUrl = ''

            // 尝试 playdata
            let vodId = playPageUrl.match(/id\/(\d+)/)?.[1] ?? ''
            if (vodId) {
                let api = `${this.webSite}/jiejie/index.php/vod/playdata/id/${vodId}/sid/1/nid/1.html`
                let pro = await req(api, { headers: this.headers })

                if (pro.data) {
                    let text = pro.data.toString().trim()
                    if (!text.startsWith('<')) {
                        let data = JSON.parse(text)
                        playUrl = data.url || ''

                        if (data.encrypt === 1) {
                            playUrl = atob(playUrl)
                        } else if (data.encrypt === 2) {
                            playUrl = decodeURIComponent(escape(atob(playUrl)))
                        }
                    }
                }
            }

            // playdata 失败 → 回退播放页（uz 会自动嗅探 iframe/m3u8）
            if (!playUrl) {
                playUrl = playPageUrl
            }

            backData.data = {
                urls: [
                    {
                        name: '默认线路',
                        url: playUrl
                    }
                ],
                headers: this.headers
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 搜索 ================= */
    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/search/wd/${encodeURIComponent(
                args.searchWord
            )}/page/${page}.html`
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let doc = parse(pro.data)
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
                        vod_remarks:
                            el.querySelector('span.pic-text')?.text?.trim() || ''
                    })
                }
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 工具 ================= */
    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        if (url.startsWith('/')) return this.webSite + url
        return this.webSite + '/' + url
    }
}

// 实例名必须和 index.json 里的 instance 一致
var jiejie2025 = new jiejieClass()
