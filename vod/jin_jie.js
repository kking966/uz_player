class jiejieClass extends WebApiBase {
    constructor() {
        super();
        this.webSite = 'https://wap.jiejiesp19.xyz/jiejie';  // 当前最新可用主地址（从发布页确认）
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://wap.jiejiesp19.xyz/jiejie/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        };
    }

    /* ================= 分类（保持你的硬编码方式，稳定） ================= */
    async getClassList(args) {
        let backData = new RepVideoClassList();
        try {
            let list = [];
            let cls = [
                ['293', '姐姐资源'],
                ['86', '奥斯卡资源'],
                ['248', '155资源'],  // 补上常见分类
                ['117', '森林资源'],
                ['337', '玉兔资源']
            ];
            for (let c of cls) {
                let vc = new VideoClass();
                vc.type_id = `${this.webSite}/index.php/vod/type/id/${c[0]}.html`;
                vc.type_name = c[1];
                list.push(vc);
            }
            backData.data = list;
        } catch (e) {
            backData.error = e.message;
        }
        return JSON.stringify(backData);
    }

    /* ================= 分类列表（你的选择器 + 兼容） ================= */
    async getVideoList(args) {
        let backData = new RepVideoList();
        try {
            let page = args.page || 1;
            let url = `${this.webSite}/index.php/vod/type/id/${args.url}/page/${page}.html`;
            let pro = await req(url, { headers: this.headers });
            backData.error = pro.error;
            if (pro.data) {
                let doc = parse(pro.data);
                let items = doc.querySelectorAll('ul.stui-vodlist li, .stui-vodlist__box');
                let videos = [];
                for (let el of items) {
                    let a = el.querySelector('h4.title a, h4 a');
                    let thumb = el.querySelector('a.stui-vodlist__thumb');
                    if (!a || !thumb) continue;
                    let pic = thumb.getAttribute('data-original') || '';
                    videos.push({
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.text.trim(),
                        vod_pic: pic.startsWith('http') ? pic : 'https:' + pic,
                        vod_remarks: el.querySelector('span.pic-text')?.text?.trim() || ''
                    });
                }
                backData.data = videos;
            }
        } catch (e) {
            backData.error = e.message;
        }
        return JSON.stringify(backData);
    }

    /* ================= 详情 + 多线路播放（修复转圈问题） ================= */
    async getVideoDetail(args) {
        let backData = new RepVideoDetail();
        try {
            let url = args.url;
            let pro = await req(url, { headers: this.headers });
            backData.error = pro.error;
            if (pro.data) {
                let doc = parse(pro.data);
                let det = new VideoDetail();
                det.vod_id = url;
                det.vod_name = doc.querySelector('h1.title, .stui-content__detail h1')?.text?.trim() || '';
                det.vod_content = doc.querySelector('.stui-content__desc')?.text?.trim() || '';
                let pic = doc.querySelector('.stui-content__thumb img')?.getAttribute('data-original') || doc.querySelector('.stui-content__thumb img')?.getAttribute('src') || '';
                det.vod_pic = pic.startsWith('http') ? pic : 'https:' + pic;

                // 直接解析页面上的播放列表（多线路多集），不再依赖失效的playdata API
                let playFrom = [];
                let playUrl = [];
                let playlistHeaders = doc.querySelectorAll('.stui-content__playlist.clearfix h4, .stui-content__playlist h4');
                let playlists = doc.querySelectorAll('.stui-content__playlist.clearfix ul, .stui-content__playlist ul');

                for (let i = 0; i < playlistHeaders.length && i < playlists.length; i++) {
                    let fromName = playlistHeaders[i].text.trim() || `线路${i + 1}`;
                    let eps = playlists[i].querySelectorAll('li a');
                    let parts = [];
                    for (let ep of eps) {
                        let epName = ep.text.trim() || '第1集';
                        let epLink = this.combineUrl(ep.getAttribute('href'));
                        if (epLink) {
                            parts.push(`${epName}$${epLink}`);
                        }
                    }
                    if (parts.length > 0) {
                        playFrom.push(fromName);
                        playUrl.push(parts.join('#'));
                    }
                }

                // 如果没有多线路，回退到单集播放页（UZ会自动嗅探视频）
                if (playFrom.length === 0) {
                    playFrom.push('姐姐视频');
                    playUrl.push(`正片$${url.replace('/detail/', '/play/')}`);  // 部分站点detail/play路径不同，备用
                }

                det.vod_play_from = playFrom.join('$$$');
                det.vod_play_url = playUrl.join('$$$');
                backData.data = det;
            }
        } catch (e) {
            backData.error = e.message;
        }
        return JSON.stringify(backData);
    }

    /* ================= 搜索（保持你的） ================= */
    async searchVideo(args) {
        let backData = new RepVideoList();
        try {
            let page = args.page || 1;
            let url = `${this.webSite}/index.php/vod/search/wd/${encodeURIComponent(args.searchWord)}/page/${page}.html`;
            let pro = await req(url, { headers: this.headers });
            backData.error = pro.error;
            if (pro.data) {
                let doc = parse(pro.data);
                let items = doc.querySelectorAll('ul.stui-vodlist li, .stui-vodlist__box');
                let videos = [];
                for (let el of items) {
                    let a = el.querySelector('h4.title a, h4 a');
                    let thumb = el.querySelector('a.stui-vodlist__thumb');
                    if (!a || !thumb) continue;
                    let pic = thumb.getAttribute('data-original') || '';
                    videos.push({
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.text.trim(),
                        vod_pic: pic.startsWith('http') ? pic : 'https:' + pic,
                        vod_remarks: el.querySelector('span.pic-text')?.text?.trim() || ''
                    });
                }
                backData.data = videos;
            }
        } catch (e) {
            backData.error = e.message;
        }
        return JSON.stringify(backData);
    }

    /* ================= 工具 ================= */
    combineUrl(url) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return this.webSite + url;
        return this.webSite + '/' + url;
    }
}

var jiejiesp = new jiejieClass();
