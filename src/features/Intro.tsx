import { Button } from '@/components/ui/button';
import { RiP2pLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';

const Intro = () => {
  return (
    <main className="-mt-20 flex min-h-dvh w-full flex-col items-center justify-center gap-8">
      <h1 className="flex scroll-m-20 gap-2 text-4xl font-extrabold tracking-tight lg:text-5xl">
        <RiP2pLine />
        <span>PeerChat</span>
      </h1>
      <div className="flex gap-4">
        <Link to="/host">
          <Button>Host</Button>
        </Link>
        <Link to="/connect">
          <Button variant="outline">Connect</Button>
        </Link>
      </div>
    </main>
  );
};

export default Intro;
