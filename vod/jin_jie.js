class jiejieClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://wap.jiejiesp19.xyz/jiejie'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Referer': this.webSite,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }
    }

    /* ================= 分类 ================= */
    async getClassList(args) {
        let backData = new RepVideoClassList()
        try {
            // WAP 站本身是通过 URL 直接分区，这里手写
            let cls = [
                ['1', '最新'],
                ['88', '国产视频'],
                ['95', '国产精品'],
                ['102', '麻豆传媒'],
                ['146', '日本有码'],
                ['147', '欧美无码']
            ]
            backData.data = cls.map(c => {
                let vc = new VideoClass()
                vc.type_id = c[0]
                vc.type_name = c[1]
                return vc
            })
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
            let url =
                page === 1
                    ? `${this.webSite}/vod/type/id/${args.url}.html`
                    : `${this.webSite}/vod/type/id/${args.url}/page/${page}.html`

            let pro = await req(url, { headers: this.headers })
            if (pro.data) {
                let doc = parse(pro.data)
                let items = doc.querySelectorAll('ul li')
                backData.data = [...items].map(el => {
                    let a = el.querySelector('a')
                    let img = el.querySelector('img')
                    if (!a) return null
                    return {
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.getAttribute('title') || a.text?.trim() || '',
                        vod_pic: img?.getAttribute('data-original') || img?.getAttribute('src') || '',
                        vod_remarks: el.querySelector('.pic-text')?.text?.trim() || ''
                    }
                }).filter(Boolean)
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
            let pro = await req(args.url, { headers: this.headers })
            if (pro.data) {
                let doc = parse(pro.data)
                let det = new VideoDetail()
                det.vod_id = args.url
                det.vod_name = doc.querySelector('h1,h2')?.text?.trim() || ''
                det.vod_pic = doc.querySelector('img')?.getAttribute('src') || ''
                det.vod_content = doc.querySelector('.jianjie,.info')?.text?.trim() || ''

                // 播放页就是详情页
                det.vod_play_from = '姐姐视频'
                det.vod_play_url = `播放$${args.url}`

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
            // 直接返回 WAP 播放页，让壳嗅探
            backData.data = args.url
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        return this.webSite + url
    }
}

var jiejie2025 = new jiejieClass()
