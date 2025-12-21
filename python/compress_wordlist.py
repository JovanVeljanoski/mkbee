#!/usr/bin/env python3
"""
Compress wordlist for web delivery.
Creates both gzip and brotli versions for optimal web serving.
"""
import gzip
import os

try:
    import brotli
    HAS_BROTLI = True
except ImportError:
    HAS_BROTLI = False
    print("⚠️  brotli not installed. Run: pip install brotli")


def compress_file(input_file: str):
    """Compress file with gzip and optionally brotli."""

    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        return

    original_size = os.path.getsize(input_file)
    print(f"📄 Original: {input_file}")
    print(f"   Size: {original_size:,} bytes ({original_size/1024/1024:.2f} MB)\n")

    # Gzip compression
    gzip_file = f"{input_file}.gz"
    with open(input_file, 'rb') as f_in:
        with gzip.open(gzip_file, 'wb', compresslevel=9) as f_out:
            f_out.writelines(f_in)

    gzip_size = os.path.getsize(gzip_file)
    print(f"✅ Gzip: {gzip_file}")
    print(f"   Size: {gzip_size:,} bytes ({gzip_size/1024/1024:.2f} MB)")
    print(f"   Reduction: {(1 - gzip_size/original_size)*100:.1f}%\n")

    # Brotli compression (better than gzip)
    if HAS_BROTLI:
        brotli_file = f"{input_file}.br"
        with open(input_file, 'rb') as f_in:
            compressed = brotli.compress(f_in.read(), quality=11)
            with open(brotli_file, 'wb') as f_out:
                f_out.write(compressed)

        brotli_size = os.path.getsize(brotli_file)
        print(f"✅ Brotli: {brotli_file}")
        print(f"   Size: {brotli_size:,} bytes ({brotli_size/1024/1024:.2f} MB)")
        print(f"   Reduction: {(1 - brotli_size/original_size)*100:.1f}%\n")

    print("📊 Summary:")
    print(f"   Original:  {original_size/1024/1024:.2f} MB")
    print(f"   Gzipped:   {gzip_size/1024/1024:.2f} MB ({gzip_size/original_size*100:.1f}%)")
    if HAS_BROTLI:
        print(f"   Brotli:    {brotli_size/1024/1024:.2f} MB ({brotli_size/original_size*100:.1f}%)")

    print("\n💡 Usage:")
    print("   1. Upload all files to your server")
    print("   2. Configure server to serve compressed versions")
    print("   3. Browsers automatically decompress")


if __name__ == "__main__":
    compress_file('mk_words.json')

