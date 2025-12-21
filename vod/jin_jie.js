// ===============================
// 姐姐视频 wap.jiejiesp19.xyz
// MacCMS 站点解析
// 可直接使用
// ===============================

var Jin_jiejie = {
    site: "姐姐视频",
    host: "https://wap.jiejiesp19.xyz",
    home: "/jiejie/",
    search: "/jiejie/index.php/vod/search.html?wd={wd}",
    headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://wap.jiejiesp19.xyz"
    },

    // ===============================
    // 首页 & 分类
    // ===============================
    homeVod: function () {
        return this.categoryVod("/jiejie/");
    },

    categoryVod: function (url) {
        let html = request(this.host + url, { headers: this.headers });

        let list = [];
        let items = pdfa(html, ".stui-vodlist li");

        items.forEach(it => {
            let a = pdfh(it, ".stui-vodlist__thumb&&a");
            if (!a) return;

            list.push({
                vod_name: pdfh(a, "a&&title"),
                vod_pic: pdfh(a, "a&&data-original"),
                vod_id: pdfh(a, "a&&href")
            });
        });

        return list;
    },

    // ===============================
    // 详情页
    // ===============================
    detail: function (id) {
        let html = request(this.host + id, { headers: this.headers });

        let vod = {
            vod_name: pdfh(html, "h1&&Text") || pdfh(html, ".title&&Text"),
            vod_pic: pdfh(html, ".stui-vodlist__thumb&&data-original"),
            vod_content: pdfh(html, ".stui-content__detail&&Text"),
        };

        // 播放列表（一般只有一集）
        let playUrl = id.replace("/detail/", "/play/").replace(".html", "/sid/1/nid/1.html");
        vod.vod_play_from = "姐姐视频";
        vod.vod_play_url = "播放$" + playUrl;

        return vod;
    },

    // ===============================
    // 播放解析
    // ===============================
    play: function (id) {
        let html = request(this.host + id, { headers: this.headers });

        // 1️⃣ 优先找 MacCMS player_data
        let match = html.match(/player_data\s*=\s*(\{.*?\});/);
        if (match) {
            let data = JSON.parse(match[1]);
            return {
                parse: 0,
                url: data.url
            };
        }

        // 2️⃣ 找 iframe
        let iframe = pdfh(html, "iframe&&src");
        if (iframe) {
            return {
                parse: 1,
                url: iframe
            };
        }

        return {
            parse: 1,
            url: id
        };
    },

    // ===============================
    // 搜索
    // ===============================
    searchVod: function (wd) {
        let url = this.search.replace("{wd}", encodeURIComponent(wd));
        let html = request(this.host + url, { headers: this.headers });

        let list = [];
        let items = pdfa(html, ".stui-vodlist li");

        items.forEach(it => {
            let a = pdfh(it, ".stui-vodlist__thumb&&a");
            if (!a) return;

            list.push({
                vod_name: pdfh(a, "a&&title"),
                vod_pic: pdfh(a, "a&&data-original"),
                vod_id: pdfh(a, "a&&href")
            });
        });

        return list;
    }
};
