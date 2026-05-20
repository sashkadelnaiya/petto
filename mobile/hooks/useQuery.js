import { useEffect, useState } from "react";

export const useQuery = (queryFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    (async () => {
      const result = await queryFn();
      if (!ignore) {
        setData(result);
        setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, deps);

  return { data, loading };
};