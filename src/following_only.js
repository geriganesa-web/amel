const { chalk, inquirer, _, fs, instagram, print, delay } = require("./index.js");

// Description 
(async () => {
    print(
        chalk`{bold.yellow
  Follow users from Target Following List\n}`);
    
    const questions = [
        {
            type: "input",
            name: "username",
            message: "Input Username:",
            validate: (val) => val.length != 0 || "Please input username!",
        },
        {
            type: "password",
            name: "password",
            mask: "*",
            message: "Input password:",
            validate: (val) => val.length != 0 || "Please input password!",
        },
        {
            type: "input",
            name: "target",
            message: "Input target's username (without '@'):",
            validate: (val) => val.length != 0 || "Please input target's username!",
        },
        {
            type: "input",
            name: "perExec",
            message: "Input limit per-execution:",
            validate: (val) => /[0-9]/.test(val) || "Only input numbers",
        },
        {
            type: "input",
            name: "delayTime",
            message: "Input sleep time (in milliseconds):",
            validate: (val) => /[0-9]/.test(val) || "Only input numbers",
        },
    ];

    try {
        const { username, password, target, perExec, delayTime } = await inquirer.prompt(questions);
        const ig = new instagram(username, password);
        print("Try to Login . . .", "wait", true);
        const login = await ig.login();
        print(`Logged in as @${login.username} (User ID: ${login.pk})`, "ok");
        print(`Collecting information of @${target} . . .`, "wait");
        const id = await ig.getIdByUsername(target),
            info = await ig.userInfo(id);
        if (!info.is_private) {
            print(`@${target} (User ID: ${id}) => Followers : ${info.follower_count}, Following : ${info.following_count}`, "ok");
            print("Collecting following list. . .", "wait");
            const targetFollowing = await ig.followingFeed(id);
            print(`Doing task with ratio ${perExec} target / ${delayTime} milliseconds \n`, "wait");
            do {
                let items = await targetFollowing.items();
                items = _.chunk(items, perExec);
                for (let i = 0; i < items.length; i++) {
                    await Promise.all(
                        items[i].map(async (following) => {
                            const status = await ig.friendshipStatus(following.pk);
                            if (!status.following && !status.followed_by) {
                                    const task = [ig.follow(following.pk)];
                                    let [follow] = await Promise.all(task);
                                    follow = follow ? chalk.bold.green(`Followed`) : chalk.bold.red("Follow");
                                    print(`• @${following.username} : ${follow}`);
                                } else print(chalk`Skipped @${following.username} {yellow because their account is already followed or following you}`);
                        })
                    );
                    if (i < items.length - 1) print(`[@${login.username}] Sleeping for ${delayTime}ms.... \n`, "wait", true);
                    await delay(delayTime);
                }
            } while (targetFollowings.moreAvailable);
            print(`Status: All tasks done!`, "ok", true);
        }
    } catch (err) {
        print(err, "err");
    }
})();