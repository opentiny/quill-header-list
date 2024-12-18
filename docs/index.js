const Quill = window.Quill;
const { default: HeaderList } = window.bundle;

Quill.register({
  [`modules/${HeaderList.moduleName}`]: HeaderList,
}, true);

const toolbarConfig = [
  [HeaderList.toolName, 'clean'],
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block', 'code'],
  ['link', 'image', 'video', 'formula'],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ direction: 'rtl' }],
  [{ size: ['small', false, 'large', 'huge'] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
];

const quill1 = new Quill('#editor1', {
  // debug: 'info',
  theme: 'snow',
  modules: {
    toolbar: {
      container: toolbarConfig,
      handlers: {
        [HeaderList.toolName]: HeaderList.toolbarHandle,
      },
    },
    [HeaderList.moduleName]: {
      topOffset: 0,
      // scrollContainer,
      container: document.getElementById('directory1'),
    },
  },
});

const quill2 = new Quill('#editor2', {
  // debug: 'info',
  theme: 'snow',
  modules: {
    toolbar: {
      container: toolbarConfig,
      handlers: {
        [HeaderList.toolName]: HeaderList.toolbarHandle,
      },
    },
    [HeaderList.moduleName]: {
      topOffset: 0,
      scrollContainer: window,
      container: document.getElementById('directory2'),
    },
  },
});

const quill = [
  quill1,
  quill2,
];
window.quill = quill;

const output = [document.getElementById('output1'), document.getElementById('output2')];

for (const [i, btn] of [document.getElementById('btn1'), document.getElementById('btn2')].entries()) {
  btn.addEventListener('click', () => {
    const content = quill[i].getContents();
    console.log(content);
    output[i].innerHTML = '';
    // eslint-disable-next-line unicorn/no-array-for-each
    content.forEach((content) => {
      const item = document.createElement('li');
      item.textContent = `${JSON.stringify(content)},`;
      output[i].appendChild(item);
    });
  });
}

for (const q of quill) {
  q.setContents([
    { insert: 'header1' },
    { attributes: { header: 1 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\nheader1.1' },
    { attributes: { header: 2 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n\nheader1.2' },
    { attributes: { header: 2 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\nheader1.2.1' },
    { attributes: { header: 3 }, insert: '\n' },
    { insert: '\n\n\n\n\n\nheader1.2.2' },
    { attributes: { header: 3 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\nheader2' },
    { attributes: { header: 2 }, insert: '\n' },
    { insert: '\n\n\nheader2.1' },
    { attributes: { header: 2 }, insert: '\n' },
    { insert: '\n\nheader2.1.1' },
    { attributes: { header: 3 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n\nheader2.1.2' },
    { attributes: { header: 3 }, insert: '\n' },
    { insert: '\n\nheader2.1.2.1' },
    { attributes: { header: 4 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\n\nheader2.1.2.1.1' },
    { attributes: { header: 5 }, insert: '\n' },
    { insert: '\n\nheader2.1.2.1.1.1' },
    { attributes: { header: 6 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\nheader3' },
    { attributes: { header: 2 }, insert: '\n' },
    { insert: '\n\n\n\nheader3.1' },
    { attributes: { header: 3 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nheader4' },
    { attributes: { header: 2 }, insert: '\n' },
    { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' },
  ]);
}
