# Chronological Tweets

Twitter is a terrible website. At least with this script,
you can view posts chronologically. ¯\\\_(ツ)\_/¯

Only tested with "new" Twitter.

# Filter Prolific Retweeters

Some accounts are worth following, but they employ underpaid
interns to retweet anything someone says who agrees with them.

This script will block *only* the retweets from these accounts. Add
your own accounts (by display name) to the `banned_retweeters` list.
By default it just contains the account I follow that prompted the
creation of this script.

Expect this to break a lot, at least until I improve it or new Twitter
gets smoothed out.

# No Looping Videos

Having videos with sound automatically loop on you and start playing 
again are pretty obnoxious, since usually you only want to play a
video once. This is especially the case if a video is annoying.

This script hijacks the javascript Twitter uses to loop the video
and automatically resets it for you at the end of the video. 

It currently does the same for gifs, and I've found I really enjoy
gifs not autoplaying on Twitter. Try it out.
