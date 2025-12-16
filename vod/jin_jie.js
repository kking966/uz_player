class jiejieClass extends WebApiBase {
    /**
     * 姐姐视频 (jiejiesp.xyz) 采集源
     */
    constructor() {
        super();
        this.url = 'https://jiejiesp.xyz/jiejie';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Referer': 'https://jiejiesp.xyz/jiejie/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        };
    }

    /**
     * 获取分类列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoClassList>}
     */
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
                // 顶部导航 + 下拉分类中的分类链接
                let elements = document.querySelectorAll('.stui-header__menu li a, .type li a');
                let list = [];
                let added = new Set(); // 去重

                for (let element of elements) {
                    let type_name = element.text.trim();
                    let href = element.getAttribute('href') || '';

                    if (!href || href === '/' || href.includes('gbook') || href.includes('topic') || href.includes('jiejiesp.xyz')) {
                        continue;
                    }
                    if (this.isIgnoreClassName(type_name)) continue;

                    // 补全相对路径
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

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
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

    /**
     * 获取视频详情（这里直接用播放页链接作为播放源）
     * @param {UZArgs} args
     * @returns {Promise<RepVideoDetail>}
     */
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
                detModel.vod_pic = document.querySelector('.stui-content__thumb img')?.getAttribute('data-original') || '';
                detModel.vod_content = '姐姐视频资源，详情请观看视频';

                // 播放地址：该站点视频在 play 页直接嵌入播放器，直接把 play 页作为播放源
                detModel.vod_play_from = '姐姐视频';
                detModel.vod_play_url = '播放$' + detailUrl;

                detModel.vod_id = detailUrl;
                backData.data = detModel;
            }
        } catch (e) {
            backData.error = '解析视频详情失败～' + e.message;
        }
        return JSON.stringify(backData);
    }

    /**
     * 搜索视频
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
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

var jiejie2025 = new jiejieClass();
