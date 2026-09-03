import { useState } from 'react';
import DocumentExplorer from '../../../components/foundation/DocumentExplorer';
import '../../../components/foundation/DocumentExplorer.css';
import './DocumentCenter.css';

export default function DocumentCenter() {
  const [treeKeyword, setTreeKeyword] = useState('');
  const [fileKeyword, setFileKeyword] = useState('');

  return (
    <div className="document-center-page">
      <DocumentExplorer
        mode="browse"
        defaultFolderId="campus-root"
        treeKeyword={treeKeyword}
        fileKeyword={fileKeyword}
        onTreeKeywordChange={setTreeKeyword}
        onFileKeywordChange={setFileKeyword}
      />
    </div>
  );
}
