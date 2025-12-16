class jiejieClass extends WebApiBase {
    constructor() {
        super();
        this.webSite = 'https://wap.jiejiesp19.xyz/jiejie';  // ← 当前最新主地址（必要！）
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://wap.jiejiesp19.xyz/jiejie/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        };
    }

    /* ================= 分类（硬编码，稳定） ================= */
    async getClassList(args) {
        let backData = new RepVideoClassList();
        try {
            let list = [];
            let cls = [
                ['293', '姐姐资源'],
                ['86', '奥斯卡资源'],
                ['248', '155资源'],     // 你之前代码漏了这个
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

    /* ================= 分类列表 ================= */
    async getVideoList(args) {
        let backData = new RepVideoList();
        try {
            let listUrl = args.url;
            if (args.page > 1) {
                listUrl = listUrl.replace(/\.html$/, '') + '/page/' + args.page + '.html';
            }
            let pro = await req(listUrl, { headers: this.headers });
            backData.error = pro.error;
            if (pro.data) {
                let doc = parse(pro.data);
                let items = doc.querySelectorAll('ul.stui-vodlist li, .stui-vodlist__box'); // 兼容两种结构
                let videos = [];
                for (let el of items) {
                    let a = el.querySelector('h4 a, .title a');
                    let thumb = el.querySelector('a.stui-vodlist__thumb');
                    if (!a || !thumb) continue;
                    videos.push({
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.text.trim(),
                        vod_pic: 'https:' + (thumb.getAttribute('data-original') || thumb.getAttribute('src') || ''),
                        vod_remarks: el.querySelector('span.pic-text, .pic-text')?.text?.trim() || ''
                    });
                }
                backData.data = videos;
            }
        } catch (e) {
            backData.error = e.message;
        }
        return JSON.stringify(backData);
    }

    /* ================= 详情 + 多线路播放（最稳定） ================= */
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
                det.vod_pic = 'https:' + (doc.querySelector('.stui-content__thumb img, img.lazyload')?.getAttribute('data-original') || doc.querySelector('.stui-content__thumb img')?.getAttribute('src') || '');
                det.vod_content = doc.querySelector('.stui-content__desc, .desc')?.text?.trim() || '姐姐视频资源';

                // 解析多线路多集（当前站点主流方式）
                let playFrom = [];
                let playUrl = [];
                let headers = doc.querySelectorAll('.stui-content__playlist h4, .playlist h4');
                let uls = doc.querySelectorAll('.stui-content__playlist ul, .playlist ul');

                for (let i = 0; i < headers.length && i < uls.length; i++) {
                    let fromName = headers[i].text.trim() || `线路${i + 1}`;
                    let eps = uls[i].querySelectorAll('li a');
                    let parts = [];
                    for (let ep of eps) {
                        let name = ep.text.trim() || '正片';
                        let link = this.combineUrl(ep.getAttribute('href'));
                        parts.push(`${name}$${link}`);
                    }
                    if (parts.length > 0) {
                        playFrom.push(fromName);
                        playUrl.push(parts.join('#'));
                    }
                }

                // 备用：如果没解析到线路，直接用详情页（UZ会嗅探iframe/video）
                if (playFrom.length === 0) {
                    playFrom.push('姐姐视频');
                    playUrl.push(`正片$${url}`);
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

    /* ================= 搜索 ================= */
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
                    let a = el.querySelector('h4 a, .title a');
                    let thumb = el.querySelector('a.stui-vodlist__thumb');
                    if (!a || !thumb) continue;
                    videos.push({
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.text.trim(),
                        vod_pic: 'https:' + (thumb.getAttribute('data-original') || thumb.getAttribute('src') || ''),
                        vod_remarks: el.querySelector('span.pic-text, .pic-text')?.text?.trim() || ''
                    });
                }
                backData.data = videos;
            }
        } catch (e) {
            backData.error = e.message;
        }
        return JSON.stringify(backData);
    }

    combineUrl(url) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return this.webSite + url;
        return this.webSite + '/' + url;
    }
}

var jiejiesp = new jiejieClass();
