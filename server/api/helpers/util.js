module.exports = {
	copy: copy
};

function copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}
