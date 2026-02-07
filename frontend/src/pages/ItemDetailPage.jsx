import { useParams } from 'react-router-dom';

import PagePlaceholder from '../components/PagePlaceholder';

function ItemDetailPage() {
  const { id } = useParams();

  return <PagePlaceholder title={`Item Detail Page (${id})`} />;
}

export default ItemDetailPage;
