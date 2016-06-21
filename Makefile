publish:
	npm run compile
	npm publish

publish-sync: publish
	cnpm sync
	tnpm sync