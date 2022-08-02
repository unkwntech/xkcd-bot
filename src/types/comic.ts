export default class Comic {
    public day: string;
    public month: string;
    public year: string;
    public num: number;
    public link: string;
    public news: string;
    public safe_title: string;
    public transcript: string;
    public alt: string;
    public img: string;
    public title: string;

    public constructor(json: any) {
        this.day = json.data;
        this.month = json.month;
        this.year = json.year;
        this.num = json.num;
        this.link = json.link;
        this.news = json.news;
        this.safe_title = json.safe_title;
        this.transcript = json.transcript;
        this.alt = json.alt;
        this.img = json.img;
        this.title = json.title;
    }

    public toEmbed(): object {
        return {
            embeds: [
                {
                    title: this.title,
                    description: this.alt,
                    image: {
                        url: this.img,
                    },
                    footer: {
                        icon_url: "http://xkcd.com/favicon.ico",
                        text: "Licensed CC-BY-NC 2.5 by Randall Munroe",
                    },
                    url: this.link,
                },
            ],
        };
    }
}
