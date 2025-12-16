class jiejieClass extends WebApiBase {
    /**
     * 姐姐视频 采集源 - 更新至最新域名
     */
    constructor() {
        super();
        this.url = 'https://wap.jiejiesp19.xyz/jiejie';  // ← 这里改为最新域名
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Referer': 'https://wap.jiejiesp19.xyz/jiejie/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        };
    }

    async getClassList(args) {
        let webUrl = args.url;
        this.webSite = this.removeTrailingSlash(webUrl);
        let backData = new RepVideoClassList();
        try {
            const pro = await req(this.webSite, { headers: this.headers });
            backData.error = pro.error;
            let proData = pro.data;
            if (proData) {
                let document = parse(proData);
                let elements = document.querySelectorAll('.stui-header__menu li a, .type li a');
                let list = [];
                let added = new Set();

                for (let element of elements) {
                    let type_name = element.text.trim();
                    let href = element.getAttribute('href') || '';

                    if (!href || href === '/' || href.includes('gbook') || href.includes('topic') || href.includes('jiejiesp.xyz')) {
                        continue;
                    }
                    if (this.isIgnoreClassName(type_name)) continue;

                    let type_id = this.combineUrl(href);

                    if (type_name && type_id && !added.has(type_id)) {
                        added.add(type_id);
                        let videoClass = new VideoClass();
                        videoClass.type_id = type_id;
                        videoClass.type_name = type_name;
                        list.push(videoClass);
                    }
                }
                backData.data = list;
            }
        } catch (e) {
            backData.error = '解析分类失败～' + e.message;
        }
        return JSON.stringify(backData);
    }

    async getVideoList(args) {
        let listUrl = this.removeTrailingSlash(args.url);
        if (args.page > 1) {
            listUrl = listUrl.replace(/\.html$/, '') + '/page/' + args.page + '.html';
        }
        let backData = new RepVideoList();
        try {
            const pro = await req(listUrl, { headers: this.headers });
            backData.error = pro.error;
            let proData = pro.data;
            if (proData) {
                let document = parse(proData);
                let items = document.querySelectorAll('.stui-vodlist__box');
                let videos = [];

                for (let item of items) {
                    let a = item.querySelector('.stui-vodlist__thumb');
                    if (!a) continue;

                    let vod_url = this.combineUrl(a.getAttribute('href') || '');
                    let vod_pic = a.getAttribute('data-original') || '';
                    let vod_name = item.querySelector('.title a')?.text.trim() || '';
                    let vod_remarks = item.querySelector('.pic-text')?.text.trim() || '';

                    if (vod_url && vod_name) {
                        let videoDet = {};
                        videoDet.vod_id = vod_url;
                        videoDet.vod_pic = vod_pic.startsWith('http') ? vod_pic : 'https:' + vod_pic;
                        videoDet.vod_name = vod_name;
                        videoDet.vod_remarks = vod_remarks;
                        videos.push(videoDet);
                    }
                }
                backData.data = videos;
            }
        } catch (e) {
            backData.error = '解析视频列表失败～' + e.message;
        }
        return JSON.stringify(backData);
    }

    async getVideoDetail(args) {
        let detailUrl = args.url;
        let backData = new RepVideoDetail();
        try {
            const pro = await req(detailUrl, { headers: this.headers });
            backData.error = pro.error;
            let proData = pro.data;
            if (proData) {
                let document = parse(proData);
                let detModel = new VideoDetail();

                detModel.vod_name = document.querySelector('.stui-content__detail h1')?.text.trim() || '';
                detModel.vod_pic = document.querySelector('.stui-content__thumb .lazyload')?.getAttribute('data-original') || '';
                if (detModel.vod_pic && !detModel.vod_pic.startsWith('http')) {
                    detModel.vod_pic = 'https:' + detModel.vod_pic;
                }
                detModel.vod_content = '姐姐视频资源';

                let playFromList = [];
                let playUrlList = [];

                let playlistHeaders = document.querySelectorAll('.stui-content__playlist.clearfix h4');
                let playlists = document.querySelectorAll('.stui-content__playlist.clearfix ul');

                for (let i = 0; i < playlistHeaders.length && i < playlists.length; i++) {
                    let fromName = playlistHeaders[i].text.trim() || `线路${i + 1}`;

                    let epis = playlists[i].querySelectorAll('li a');
                    let urlParts = [];
                    for (let ep of epis) {
                        let epName = ep.text.trim() || '第1集';
                        let epUrl = this.combineUrl(ep.getAttribute('href') || '');
                        if (epUrl) {
                            urlParts.push(`${epName}$${epUrl}`);
                        }
                    }
                    if (urlParts.length > 0) {
                        playFromList.push(fromName);
                        playUrlList.push(urlParts.join('#'));
                    }
                }

                if (playFromList.length === 0) {
                    playFromList.push('姐姐视频');
                    playUrlList.push(`播放$${detailUrl}`);
                }

                detModel.vod_play_from = playFromList.join('$$$');
                detModel.vod_play_url = playUrlList.join('$$$');

                detModel.vod_id = detailUrl;
                backData.data = detModel;
            }
        } catch (e) {
            backData.error = '解析视频详情失败～' + e.message;
        }
        return JSON.stringify(backData);
    }

    async searchVideo(args) {
        let searchUrl = this.webSite + '/index.php/vod/search/wd/' + encodeURIComponent(args.searchWord) + '/page/' + args.page + '.html';
        let backData = new RepVideoList();
        try {
            const pro = await req(searchUrl, { headers: this.headers });
            backData.error = pro.error;
            let proData = pro.data;
            if (proData) {
                let document = parse(proData);
                let items = document.querySelectorAll('.stui-vodlist__box');
                let videos = [];

                for (let item of items) {
                    let a = item.querySelector('.stui-vodlist__thumb');
                    if (!a) continue;

                    let vod_url = this.combineUrl(a.getAttribute('href') || '');
                    let vod_pic = a.getAttribute('data-original') || '';
                    let vod_name = item.querySelector('.title a')?.text.trim() || '';
                    let vod_remarks = item.querySelector('.pic-text')?.text.trim() || '';

                    if (vod_url && vod_name) {
                        let videoDet = {};
                        videoDet.vod_id = vod_url;
                        videoDet.vod_pic = vod_pic.startsWith('http') ? vod_pic : 'https:' + vod_pic;
                        videoDet.vod_name = vod_name;
                        videoDet.vod_remarks = vod_remarks;
                        videos.push(videoDet);
                    }
                }
                backData.data = videos;
            }
        } catch (e) {
            backData.error = '搜索失败～' + e.message;
        }
        return JSON.stringify(backData);
    }

    ignoreClassName = ['首页', '地址发布', '🌐地址发布'];
    
    combineUrl(url) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return this.webSite + url;
        return this.webSite + '/' + url;
    }

    isIgnoreClassName(name) {
        return this.ignoreClassName.some(ignore => name.includes(ignore));
    }

    removeTrailingSlash(str) {
        return str.endsWith('/') ? str.slice(0, -1) : str;
    }
}

var jiejiesp = new jiejieClass();
