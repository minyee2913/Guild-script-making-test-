import {
	open
} from "ez:sqlite3";

import {
	executeCommand,
	registerCommand,
	registerOverride,
		addEnum
} from "ez:command";

import {
	send
} from "ez:formui";

import {
	onPlayerInitialized
} from "ez:player";

const system = server.registerSystem(0, 0);

const db = open('guild.db');
db.exec('CREATE TABLE IF NOT EXISTS Guild(name, owner_xuid, owner_name, lv);');
db.exec('CREATE TABLE IF NOT EXISTS member(name, xuid, guild);');
db.exec('CREATE TABLE IF NOT EXISTS kicked(xuid);');

onPlayerInitialized(player => {
	let playerXuid = player.xuid
	let playerName = player.name
	let ifkicked = db.prepare(`SELECT xuid FROM kicked`);
	ifkicked.forEach(xuid => {
		if (xuid === playerXuid) {
			db.exec(`DELETE FROM kicked WHERE xuid = '${playerXuid}'`);
			system.executeCommand("tag @a[name=\"" + playerName + "\"] remove has_guild", {});
			system.executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ tellraw @a {\"rawtext\":[{\"text\":\"§c길드에서 추방당했습니다!\"}]}", {});
			system.executeCommand("custom-name set postfix @a[name=\"" + playerName + "\"] \"§r [§7무소속§r] \"", {});
		}
	});
});

registerCommand("guild", "길드 명령어", 0);
registerOverride("guild", [], function () {
	if (this.player) {
		let playerName = this.player.name
		executeCommand("execute @a[name=\"" + playerName + "\",tag=!has_guild,tag=!guild_owner] ~ ~ ~ ㈜　 길드없음");
		executeCommand("execute @a[name=\"" + playerName + "\",tag=has_guild,tag=guild_owner] ~ ~ ~ ㈜　 길드장");
	}
});
registerCommand("㈜　", "㈜　", 1);
addEnum("no_guild", ["길드없음"]);
registerOverride("㈜　", [{ type: "enum", name: "길드없음", optional: false, enum: "no_guild" }], function () {
	if (this.player) {
		let playerName = this.player.name
		send(this.player, {
			type: "form",
			title: "길드",
			content: "길드를 맺어보세요!",
			buttons: [
				{
					"text": "길드 만들기",

				},
				{
					"text": "길드 가입하기",

				}
			]
		}, data => {
				if (data == null) return;
				const playerName = this.player.name;
				if (data == 0) executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ ㈜　 생성");
				if (data == 1) executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ ㈜　 가입");

		});

		return null
	}
});
addEnum("kicked", ["kicked"]);
registerOverride("㈜　", [{ type: "enum", name: "kicked", optional: false, enum: "kicked" }], function () {
	if (this.player) {
		let playerXuid = this.player.xuid
		let playerName = this.player.name
		let ifkicked = db.prepare(`SELECT xuid FROM kicked`);
		ifkicked.forEach(xuid => {
			if (xuid === playerXuid) {
				db.exec(`DELETE FROM kicked WHERE xuid = '${playerXuid}'`);
				executeCommand("tag @a[name=\"" + playerName + "\"] remove has_guild");
				executeCommand("tag @a[name=\"" + playerName + "\"] remove guild_owner");
				executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ tellraw @a {\"rawtext\":[{\"text\":\"§c길드에서 추방당했습니다!\"}]}");
				executeCommand("custom-name set postfix @a[name=\"" + playerName + "\"] \"§r [§7무소속§r] \"");
			}
		});
	}
});
addEnum("owner_guild", ["길드장"]);
registerOverride("㈜　", [{ type: "enum", name: "길드장", optional: false, enum: "owner_guild" }], function () {
	if (this.player) {
		let playerName = this.player.name
		send(this.player, {
			type: "form",
			title: "길드 관리",
			content: "",
			buttons: [
				{
					"text": "길드장 이전",

				},
				{
					"text": "길드원 목록",

				},
				{
					"text": "길드 해산"
				}
			]
		}, data => {
			if (data == null) return;
			const playerName = this.player.name;
			if (data == 0) executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ ㈜　 이전");
			if (data == 1) executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ ㈜　 목록");
			if (data == 2) send(this.player, {
				type: "custom_form",
				title: "경고",
				content: [
					{
						"type": "label",
						"text": "정말로 길드를 해산하시겠습니까?"
					}
				]
			}, data => {
					if (data == null) return;
					let playerXuid = this.player.xuid;
					executeCommand("tellraw @a[name=\"" + playerName + "\"] { \"rawtext\":[{\"text\":\"§c§l길드가 성공적으로 해산되었습니다\"}]}");
					executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ tag @s remove guild_owner");
					executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ tag @s remove has_guild");
					executeCommand("custom-name set postfix @a[name=\"" + playerName + "\"] \"§r [§7무소속§r] \"");
					executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ playsound random.anvil_break @s ~ ~ ~");
					let ifdeleted1 = db.prepare(`SELECT name FROM Guild WHERE owner_xuid = '${playerXuid}'`);
					ifdeleted1.forEach(name => {
						let ifdeleted2 = db.prepare(`SELECT xuid FROM member WHERE guild = '${name}'`);
						ifdeleted2.forEach(xuid => {
							db.exec(`INSERT INTO kicked VALUES ('${xuid}')`)
							db.exec(`DELETE FROM member WHERE xuid = '${xuid}'`);
						});
						db.exec(`DELETE FROM Guild WHERE name = '${name}'`);
						executeCommand("execute @a[name=!" + playerName + "] ~ ~ ~ ㈜　 kicked");
					});
			});
			return null
		});
		return null
	}
});
addEnum("make", ["생성"]);
registerOverride("㈜　", [{ type: "enum", name: "생성", optional: false, enum: "make" }], function () {
	if (this.player) {
		let playerName = this.player.name
		send(this.player, {
			type: "custom_form",
			title: "길드 생성",
			content: [
				{
					"type": "label",
					"text": "당신은 훌륭한 길드장이 되실 수 있으실거에요!",

				},
				{
					"type": "input",
					"text": "",
					"placeholder": "길드 이름을 입력해주세요"

				}
			]
		}, data => {
			if (data == null) return;
			const playerName = this.player.name;
			const playerXuid = this.player.xuid;
			const [, guildName] = data;

			let flag = false;
			const sqlResult = db.prepare(`SELECT name FROM Guild WHERE name=?;`);
			sqlResult.bind(1, guildName);
			sqlResult.forEach((name) => {
				if (name === name) {
					flag = true;
					return;
                }
			});

			if (flag) {
				executeCommand("tellraw @a[name=\"" + playerName + "\"] {\"rawtext\":[{\"text\":\"§c§l이미 존재하는 길드입니다!\"}]}");
				executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ playsound random.break @s ~ ~ ~");
				executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ ㈜　 생성");
			}

			else {
				executeCommand("tellraw @a[name=\"" + playerName + "\"] {\"rawtext\":[{\"text\":\"§a§l길드가 성공적으로 생성되었습니다\"}]}");
				executeCommand("tag @a[name=\"" + playerName + "\"] add has_guild");
				executeCommand("tag @a[name=\"" + playerName + "\"] add guild_owner");
				executeCommand("custom-name set postfix \"" + playerName + "\" \"§r [§a" + guildName + "§r] \"");
				db.exec(`INSERT INTO Guild VALUES ('${guildName}', '${playerXuid}', '${playerName}', '1');`);
				executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ playsound random.anvil_use @s ~ ~ ~");
            }

		});

		return null
	}
});
addEnum("search", ["가입"]);
registerOverride("㈜　", [{ type: "enum", name: "가입", optional: false, enum: "search" }], function () {
	if (this.player) {
		let playerName = this.player.name
		send(this.player, {
			type: "custom_form",
			title: "길드 가입",
			content: [
				{
					"type": "input",
					"text": "가입할 길드의 이름을 적으세요",
					"placeholder": "검색"

				}
			]
		}, search => {
				if (search == null) return;
				const playerName = this.player.name;
				const playerXuid = this.player.xuid;
				const searchv = db.prepare(`SELECT * FROM Guild WHERE name = '${search}';`);
				executeCommand("tellraw @a[name=\"" + playerName + "\"] {\"rawtext\":[{\"text\":\"§a§l아무것도 뜨지 않는다면 그런 길드는 존재하지 않다는 겁니다!\"}]}");
				searchv.forEach((name, xuid, owner, lv) => {
					send(this.player, {
						type: "custom_form",
						title: "길드 정보",
						content: [
							{
								"type": "label",
								"text": "길드명 : " + name + "\n길드장 : " + owner + "\n길드 레벨 " + lv
							}
						]
					}, data => {
							send(this.player, {
								type: "form",
								title: "길드 가입",
								content: name + " 길드에 가입하시겠습니까?",
								buttons: [
									{
										"text": "§a예"
									},
									{
										"text": "§c아니요"
									}
								]
							}, data => {
									if (data == 0) db.exec(`INSERT INTO member VALUES ('${playerName}', '${playerXuid}', '${name}');`);
									if (data == 0) executeCommand("tellraw @a[name=\"" + playerName + "\"] {\"rawtext\":[{\"text\":\"§a§l길드에 성공적으로 가입되었습니다\"}]}");
									if (data == 0) executeCommand("tag @a[name=\"" + playerName + "\"] add has_guild");
									if (data == 0) executeCommand("execute @a[name=\"" + playerName + "\"] ~ ~ ~ playsound random.anvil_use @s ~ ~ ~");
									if (data == 0) executeCommand("custom-name set postfix \"" + playerName + "\" \"§r [§a" + name + "§r] \"");
							});
					});
				});
		});

		return null
	}
});
console.log("guild.js loaded");