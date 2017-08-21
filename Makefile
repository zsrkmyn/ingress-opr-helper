PROJECT_NAME=ingress-opr-helper

.PHONY=distribute

distribute:
	chromium --pack-extension=${PROJECT_NAME} --pack-extension-key=${PROJECT_NAME}.pem
