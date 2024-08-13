# Mastodon - Codeberg.org - first-branch behavior for commit graph

Adds a toggle to show the commit graph with only commits that are the
first parent in a chain from the HEAD commit, skipping commits that are
part of branches that have been merged.

This is a convenient way of showing complicated merge histories, and
is equivalent to the Git command `git log --first-branch`. I don't
currently know of any web interface for Git that is able to show this
perspective.
